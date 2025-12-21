import os
import base64
_sbox = [
99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118,202,130,201,125,250,89,71,240,173,212,162,175,156,164,114,192,
183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21,4,199,35,195,24,150,5,154,7,18,128,226,235,39,178,117,
9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132,83,209,0,237,32,252,177,91,106,203,190,57,74,76,88,207,
208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168,81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210,
205,12,19,236,95,151,68,23,196,167,126,61,100,93,25,115,96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219,
224,50,58,10,73,6,36,92,194,211,172,98,145,149,228,121,231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8,
186,120,37,46,28,166,180,198,232,221,116,31,75,189,139,138,112,62,181,102,72,3,246,14,97,53,87,185,134,193,29,158,
225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223,140,161,137,13,191,230,66,104,65,153,45,15,176,84,187,22
]
_inv_sbox = [0]*256
for i,v in enumerate(_sbox):
    _inv_sbox[v]=i

_rcon = [0x00,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1B,0x36]

def _xtime(a):
    a &= 0xFF
    return ((a << 1) ^ 0x1B) & 0xFF if (a & 0x80) else (a << 1) & 0xFF

def _mul(a,b):
    a &= 0xFF; b &= 0xFF
    res = 0
    while b:
        if b & 1:
            res ^= a
        a = _xtime(a)
        b >>= 1
    return res & 0xFF

def _pkcs7_pad(b, block=16):
    padlen = block - (len(b) % block)
    return b + bytes([padlen])*padlen

def _pkcs7_unpad(b):
    padlen = b[-1]
    if padlen < 1 or padlen > 16:
        raise ValueError("Padding hatası")
    if b[-padlen:] != bytes([padlen])*padlen:
        raise ValueError("Padding hatası")
    return b[:-padlen]

def _bytes2state(block16):
    s = [list(block16[i:i+4]) for i in range(0,16,4)]
    return [[s[c][r] for c in range(4)] for r in range(4)]

def _state2bytes(state):
    out = bytearray(16)
    for r in range(4):
        for c in range(4):
            out[c*4 + r] = state[r][c] & 0xFF
    return bytes(out)

def _add_round_key(state, rk):
    for r in range(4):
        for c in range(4):
            state[r][c] ^= rk[r][c]

def _sub_bytes(state):
    for r in range(4):
        for c in range(4):
            state[r][c] = _sbox[state[r][c]]

def _inv_sub_bytes(state):
    for r in range(4):
        for c in range(4):
            state[r][c] = _inv_sbox[state[r][c]]

def _shift_rows(state):
    state[1] = state[1][1:] + state[1][:1]
    state[2] = state[2][2:] + state[2][:2]
    state[3] = state[3][3:] + state[3][:3]

def _inv_shift_rows(state):
    state[1] = state[1][-1:] + state[1][:-1]
    state[2] = state[2][-2:] + state[2][:-2]
    state[3] = state[3][-3:] + state[3][:-3]

def _mix_columns(state):
    for c in range(4):
        a0 = state[0][c]; a1 = state[1][c]; a2 = state[2][c]; a3 = state[3][c]
        state[0][c] = _mul(a0,2) ^ _mul(a1,3) ^ a2 ^ a3
        state[1][c] = a0 ^ _mul(a1,2) ^ _mul(a2,3) ^ a3
        state[2][c] = a0 ^ a1 ^ _mul(a2,2) ^ _mul(a3,3)
        state[3][c] = _mul(a0,3) ^ a1 ^ a2 ^ _mul(a3,2)

def _inv_mix_columns(state):
    for c in range(4):
        a0 = state[0][c]; a1 = state[1][c]; a2 = state[2][c]; a3 = state[3][c]
        state[0][c] = _mul(a0,14) ^ _mul(a1,11) ^ _mul(a2,13) ^ _mul(a3,9)
        state[1][c] = _mul(a0,9) ^ _mul(a1,14) ^ _mul(a2,11) ^ _mul(a3,13)
        state[2][c] = _mul(a0,13) ^ _mul(a1,9) ^ _mul(a2,14) ^ _mul(a3,11)
        state[3][c] = _mul(a0,11) ^ _mul(a1,13) ^ _mul(a2,9) ^ _mul(a3,14)

def _rot_word(w):
    return w[1:]+w[:1]

def _sub_word(w):
    return [_sbox[x] for x in w]

def _expand_key_128(key16):
    if len(key16) != 16:
        raise ValueError("AES-128 key 16 byte olmalı")
    w = []
    for i in range(4):
        w.append([key16[4*i], key16[4*i+1], key16[4*i+2], key16[4*i+3]])
    for i in range(4, 44):
        temp = w[i-1].copy()
        if i % 4 == 0:
            temp = _sub_word(_rot_word(temp))
            temp[0] ^= _rcon[i//4]
        w.append([w[i-4][j] ^ temp[j] for j in range(4)])
    rks = []
    for r in range(11):
        rk = [[0]*4 for _ in range(4)]
        for c in range(4):
            word = w[r*4 + c]
            for rr in range(4):
                rk[rr][c] = word[rr]
        rks.append(rk)
    return rks

def _aes_encrypt_block(block16, rks):
    state = _bytes2state(block16)
    _add_round_key(state, rks[0])
    for rnd in range(1,10):
        _sub_bytes(state)
        _shift_rows(state)
        _mix_columns(state)
        _add_round_key(state, rks[rnd])
    _sub_bytes(state)
    _shift_rows(state)
    _add_round_key(state, rks[10])
    return _state2bytes(state)

def _aes_decrypt_block(block16, rks):
    state = _bytes2state(block16)
    _add_round_key(state, rks[10])
    for rnd in range(9,0,-1):
        _inv_shift_rows(state)
        _inv_sub_bytes(state)
        _add_round_key(state, rks[rnd])
        _inv_mix_columns(state)
    _inv_shift_rows(state)
    _inv_sub_bytes(state)
    _add_round_key(state, rks[0])
    return _state2bytes(state)

def aes_manual_encrypt(plaintext: str, key: str) -> str:
    kb = key.encode("utf-8")
    if len(kb) < 16:
        kb = kb + bytes(16-len(kb))
    elif len(kb) > 16:
        kb = kb[:16]
    rks = _expand_key_128(kb)
    iv = os.urandom(16)
    pt = _pkcs7_pad(plaintext.encode("utf-8"), 16)
    out = bytearray()
    prev = iv
    for i in range(0, len(pt), 16):
        block = bytes([pt[i+j] ^ prev[j] for j in range(16)])
        ct = _aes_encrypt_block(block, rks)
        out += ct
        prev = ct
    return base64.b64encode(iv + out).decode("utf-8")

def aes_manual_decrypt(ciphertext_b64: str, key: str) -> str:
    kb = key.encode("utf-8")
    if len(kb) < 16:
        kb = kb + bytes(16-len(kb))
    elif len(kb) > 16:
        kb = kb[:16]
    rks = _expand_key_128(kb)
    raw = base64.b64decode(ciphertext_b64)
    iv = raw[:16]
    ct = raw[16:]
    if len(ct) % 16 != 0:
        raise ValueError("Geçersiz AES ciphertext")
    out = bytearray()
    prev = iv
    for i in range(0, len(ct), 16):
        block = ct[i:i+16]
        dec = _aes_decrypt_block(block, rks)
        ptb = bytes([dec[j] ^ prev[j] for j in range(16)])
        out += ptb
        prev = block
    return _pkcs7_unpad(bytes(out)).decode("utf-8")
