#pragma once
#include <windows.h>
#include <cstring>
#include <cstdio>

using D3DCOLOR = DWORD;

namespace sampapi_detail
{
    inline uintptr_t GetSampBase()
    {
        static uintptr_t base = 0;
        if (!base)
            base = reinterpret_cast<uintptr_t>(GetModuleHandleA("samp.dll"));
        return base;
    }
}

inline void* GetAddress(DWORD offset)
{
    uintptr_t base = sampapi_detail::GetSampBase();
    return base ? reinterpret_cast<void*>(base + offset) : nullptr;
}

using ID = unsigned short;
using CMDPROC = void(__cdecl*)(const char*);

class CRemotePlayer
{
public:
    void* m_pPed;
    void* m_pVehicle;
    ID    m_nId;
    ID    m_nVehicleId;
};

class CPlayerPool
{
public:
    CRemotePlayer* GetPlayer(ID nId);
    BOOL IsConnected(ID nId);
};

inline CRemotePlayer* CPlayerPool::GetPlayer(ID nId) {
    return ((CRemotePlayer * (__thiscall*)(CPlayerPool*, ID))GetAddress(0x10F0))(this, nId);
}
inline BOOL CPlayerPool::IsConnected(ID nId) {
    return ((BOOL(__thiscall*)(CPlayerPool*, ID))GetAddress(0x10B0))(this, nId);
}

class CChat
{
public:
    void AddMessage(D3DCOLOR color, const char* szText);
};

inline CChat*& RefChat() {
    return *(CChat**)GetAddress(0x26E8C8);
}
inline void CChat::AddMessage(D3DCOLOR color, const char* szText) {
    ((void(__thiscall*)(CChat*, D3DCOLOR, const char*))GetAddress(0x679F0))(this, color, szText);
}

class CInput
{
public:
    void Send(const char* szString);
    void AddCommand(const char* szName, CMDPROC handler);
};

inline CInput*& RefInputBox() {
    return *(CInput**)GetAddress(0x26E8CC);
}
inline void CInput::Send(const char* szString) {
    ((void(__thiscall*)(CInput*, const char*))GetAddress(0x69190))(this, szString);
}
inline void CInput::AddCommand(const char* szName, CMDPROC handler) {
    ((void(__thiscall*)(CInput*, const char*, CMDPROC))GetAddress(0x69000))(this, szName, handler);
}

class CNetGame
{
public:
    CPlayerPool* GetPlayerPool();
};

inline CNetGame*& RefNetGame() {
    return *(CNetGame**)GetAddress(0x26E8DC);
}
inline CPlayerPool* CNetGame::GetPlayerPool() {
    return ((CPlayerPool * (__thiscall*)(CNetGame*))GetAddress(0x1160))(this);
}