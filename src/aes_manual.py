import os
import base64



SBOX = [
99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118,202,130,201,125,250,89,71,240,173,212,162,175,
156,164,114,192,183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21,4,199,35,195,24,150,5,154,
7,18,128,226,235,39,178,117,9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132,83,209,0,237,
32,252,177,91,106,203,190,57,74,76,88,207,208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168,
81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210,205,12,19,236,95,151,68,23,196,167,126,
61,100,93,25,115,96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219,224,50,58,10,73,6,36,
92,194,211,172,98,145,149,228,121,231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8,186,
120,37,46,28,166,180,198,232,221,116,31,75,189,139,138,112,62,181,102,72,3,246,14,97,53,87,185,
134,193,29,158,225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223,140,161,137,13,191,230,
66,104,65,153,45,15,176,84,187,22
]

INV_SBOX = [0]*256
for i, v in enumerate(SBOX):
    INV_SBOX[v] = i

RCON = [0x00,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1B,0x36]



def xtime(a):
    return ((a << 1) ^ 0x1B) & 0xFF if a & 0x80 else (a << 1) & 0xFF

def mul(a, b):
    res = 0
    while b:
        if b & 1:
            res ^= a
        a = xtime(a)
        b >>= 1
    return res & 0xFF

def pkcs7_pad(data):
    pad = 16 - (len(data) % 16)
    return data + bytes([pad]) * pad

def pkcs7_unpad(data):
    pad = data[-1]
    if data[-pad:] != bytes([pad]) * pad:
        raise ValueError("Padding hatası")
    return data[:-pad]



def bytes_to_state(block):
    state = [[0]*4 for _ in range(4)]
    for i in range(16):
        state[i % 4][i // 4] = block[i]
    return state

def state_to_bytes(state):
    out = bytearray(16)
    for i in range(16):
        out[i] = state[i % 4][i // 4]
    return bytes(out)


def add_round_key(state, rk):
    for r in range(4):
        for c in range(4):
            state[r][c] ^= rk[r][c]

def sub_bytes(state):
    for r in range(4):
        for c in range(4):
            state[r][c] = SBOX[state[r][c]]

def inv_sub_bytes(state):
    for r in range(4):
        for c in range(4):
            state[r][c] = INV_SBOX[state[r][c]]

def shift_rows(state):
    for r in range(1,4):
        state[r] = state[r][r:] + state[r][:r]

def inv_shift_rows(state):
    for r in range(1,4):
        state[r] = state[r][-r:] + state[r][:-r]

def mix_columns(state):
    for c in range(4):
        a = [state[r][c] for r in range(4)]
        state[0][c] = mul(a[0],2)^mul(a[1],3)^a[2]^a[3]
        state[1][c] = a[0]^mul(a[1],2)^mul(a[2],3)^a[3]
        state[2][c] = a[0]^a[1]^mul(a[2],2)^mul(a[3],3)
        state[3][c] = mul(a[0],3)^a[1]^a[2]^mul(a[3],2)

def inv_mix_columns(state):
    for c in range(4):
        a = [state[r][c] for r in range(4)]
        state[0][c] = mul(a[0],14)^mul(a[1],11)^mul(a[2],13)^mul(a[3],9)
        state[1][c] = mul(a[0],9)^mul(a[1],14)^mul(a[2],11)^mul(a[3],13)
        state[2][c] = mul(a[0],13)^mul(a[1],9)^mul(a[2],14)^mul(a[3],11)
        state[3][c] = mul(a[0],11)^mul(a[1],13)^mul(a[2],9)^mul(a[3],14)



def expand_key(key):
    w = [[key[4*i+j] for j in range(4)] for i in range(4)]
    for i in range(4, 44):
        temp = w[i-1].copy()
        if i % 4 == 0:
            temp = temp[1:] + temp[:1]
            temp = [SBOX[x] for x in temp]
            temp[0] ^= RCON[i//4]
        w.append([w[i-4][j] ^ temp[j] for j in range(4)])

    round_keys = []
    for r in range(11):
        rk = [[0]*4 for _ in range(4)]
        for c in range(4):
            for rr in range(4):
                rk[rr][c] = w[r*4 + c][rr]
        round_keys.append(rk)
    return round_keys



def encrypt_block(block, rks):
    state = bytes_to_state(block)
    add_round_key(state, rks[0])

    for r in range(1,10):
        sub_bytes(state)
        shift_rows(state)
        mix_columns(state)
        add_round_key(state, rks[r])

    sub_bytes(state)
    shift_rows(state)
    add_round_key(state, rks[10])
    return state_to_bytes(state)

def decrypt_block(block, rks):
    state = bytes_to_state(block)
    add_round_key(state, rks[10])

    for r in range(9,0,-1):
        inv_shift_rows(state)
        inv_sub_bytes(state)
        add_round_key(state, rks[r])
        inv_mix_columns(state)

    inv_shift_rows(state)
    inv_sub_bytes(state)
    add_round_key(state, rks[0])
    return state_to_bytes(state)



def aes_manual_encrypt(plaintext, key):
    key = key.encode()[:16].ljust(16, b'\x00')
    rks = expand_key(key)
    iv = os.urandom(16)

    data = pkcs7_pad(plaintext.encode())
    out = bytearray()
    prev = iv

    for i in range(0, len(data), 16):
        block = bytes(data[i+j] ^ prev[j] for j in range(16))
        enc = encrypt_block(block, rks)
        out += enc
        prev = enc

    return base64.b64encode(iv + out).decode()

def aes_manual_decrypt(ciphertext_b64, key):
    key = key.encode()[:16].ljust(16, b'\x00')
    rks = expand_key(key)

    raw = base64.b64decode(ciphertext_b64)
    iv, data = raw[:16], raw[16:]

    out = bytearray()
    prev = iv

    for i in range(0, len(data), 16):
        block = data[i:i+16]
        dec = decrypt_block(block, rks)
        out += bytes(dec[j] ^ prev[j] for j in range(16))
        prev = block

    return pkcs7_unpad(bytes(out)).decode()
