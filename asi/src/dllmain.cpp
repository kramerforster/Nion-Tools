#include "sampapi_min.h"
#include <string>

void initTools();
void HandleVehicleCommand(const char* arg, const std::string& action, const std::string& usageMsg);

BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason_for_call, LPVOID)
{
    switch (ul_reason_for_call)
    {
    case DLL_PROCESS_ATTACH:
        DisableThreadLibraryCalls(hModule);
        CreateThread(nullptr, 0, [](LPVOID) -> DWORD {
            while (!GetModuleHandleA("samp.dll"))
                Sleep(100);
            while (!RefInputBox())
                Sleep(100);

            initTools();
            return 0;
            }, nullptr, 0, nullptr);
        break;

    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}


inline void Send(const char* text)
{
    char buf[256];
    sprintf_s(buf, sizeof(buf), "{6421F2}[Nion Tools] {FFFFFF}%s", text);
    RefChat()->AddMessage(0xFFFFFFFF, buf);
}

void HandleVehicleCommand(const char* arg, const std::string& action, const std::string& usageMsg)
{
    if (!arg || std::strlen(arg) == 0) return Send(usageMsg.c_str());
    int id = std::atoi(arg);
    ID targetPlayerID = static_cast<ID>(id);
    CNetGame* pNetGame = RefNetGame();
    CPlayerPool* pPlayerPool = pNetGame->GetPlayerPool();
    if (!pPlayerPool->IsConnected(targetPlayerID)) return Send("Игрок не найден.");
    CRemotePlayer* pPlayer = pPlayerPool->GetPlayer(targetPlayerID);
    if (!pPlayer) return Send("Игрок не найден.");
    if (!pPlayer->m_pPed) return Send("Игрок не в стриме.");
    uint16_t vehicleId = pPlayer->m_nVehicleId;
    if (vehicleId == 0) return Send("Игрок не в транспорте.");

    char msg[128];
    sprintf_s(msg, sizeof(msg), "/%s %u", action.c_str(), vehicleId);
    RefInputBox()->Send(msg);
}

void initTools()
{
    CInput* input = RefInputBox();
    input->AddCommand("fix", [](const char* arg) {
        HandleVehicleCommand(arg, "fixcar", "Использование: /fix [ID игрока]");
        });
    input->AddCommand("spveh", [](const char* arg) {
        HandleVehicleCommand(arg, "spcar", "Использование: /spveh [ID игрока]");
        });
    input->AddCommand("tpcar", [](const char* arg) {
        HandleVehicleCommand(arg, "getcar", "Использование: /tpcar [ID игрока]");
        });
    input->AddCommand("tflip", [](const char* arg) {
        HandleVehicleCommand(arg, "flip", "Использование: /tflip [ID игрока]");
        });
    input->AddCommand("tdoc", [](const char* arg) {
        HandleVehicleCommand(arg, "acarpass", "Использование: /tdoc [ID игрока]");
        });
}
