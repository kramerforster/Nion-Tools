#include "Plugin.h"
#include <sampapi/CChat.h>
#include <sampapi/CInput.h>
#include <sampapi/CNetGame.h>
#include <RakHook/rakhook.hpp>
#include <RakNet/StringCompressor.h>
#include <windows.h>
#include <string>
#include <winsock2.h>
#include <cstring>

namespace samp = sampapi::v037r3;

Plugin::Plugin(HMODULE hndl) : hModule(hndl) {
    using namespace std::placeholders;
    hookCTimerUpdate.set_cb(std::bind(&Plugin::mainloop, this, _1));
    hookCTimerUpdate.install();
}

void HandleVehicleCommand(const char* arg, const std::string& action, const std::string& usageMsg) {
    if (!arg || std::strlen(arg) == 0) {
        samp::RefChat()->AddMessage(0xFFFFFFFF, usageMsg.c_str());
        return;
    }
    int id = std::atoi(arg);
    uint16_t targetPlayerID = static_cast<uint16_t>(id);
    samp::CPlayerPool* pPlayerPool = samp::RefNetGame()->GetPlayerPool();
    samp::CRemotePlayer* pPlayer = pPlayerPool->GetPlayer(targetPlayerID);
    if (!pPlayer || !pPlayer->DoesExist()) return samp::RefChat()->AddMessage(0xFFFFFFFF, "Игрок не в стриме.");
    uint16_t vehicleId = pPlayer->m_nVehicleId;
    if (vehicleId == 0) return samp::RefChat()->AddMessage(0xFFFFFFFF, "Игрок не находится в транспорте.");
    char msg[128];
    std::sprintf(msg, "/%s %u", action.c_str(), vehicleId);
    auto* input = samp::RefInputBox();
    if (input) {
        input->Send(msg);
    }
}


static std::string formatString(const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    char buf[8024];
    va_list argsCopy;
    va_copy(argsCopy, args);
    int len = vsnprintf(buf, sizeof(buf), fmt, args);
    va_end(args);

    if (len < 0) {
        va_end(argsCopy);
        return {};
    }

    if (len < static_cast<int>(sizeof(buf))) {
        va_end(argsCopy);
        return std::string(buf, len);
    }
    std::vector<char> dynbuf(len + 1);
    vsnprintf(dynbuf.data(), dynbuf.size(), fmt, argsCopy);
    va_end(argsCopy);

    return std::string(dynbuf.data(), len);
}

struct Mansion {
    std::string name;
    float x, y, z;
    std::string controller;
};


static std::string trim(const std::string& str) {
    size_t first = str.find_first_not_of(" ,");
    if (first == std::string::npos) return "";
    size_t last = str.find_last_not_of(" ,");
    return str.substr(first, last - first + 1);
}

static std::vector<Mansion> g_mansions = {
  { "Западный особняк",  -3244.5615f,  828.8303f,   6.7008f, "" },
  { "Северный особняк", 4056.4377f, 3810.4175f,  6.6265f, "" },
  { "Центральный особняк",   1951.0255f,   31.3883f,  -0.4672f, "" },
  { "Особняк мафии №4",          2327.5828f, 1534.8408f,  11.3457f, "" }
};


static bool g_checkInProgress = false;
static size_t g_currentMansionIndex = 0;
 void updateMansionController(const std::string& normalizedText) {
    size_t pos = normalizedText.find("Контролирует:");
    if (pos == std::string::npos) return;
    std::string name = trim(normalizedText.substr(0, pos));
    std::string controller = trim(normalizedText.substr(pos + strlen("Контролирует:")));
    for (auto& m : g_mansions) {
        if (m.name == name) {
            if (g_checkInProgress && g_currentMansionIndex < g_mansions.size() &&
                g_mansions[g_currentMansionIndex].name != name) {
                return;
            }

            m.controller = controller;

            if (g_checkInProgress && g_currentMansionIndex < g_mansions.size() &&
                g_mansions[g_currentMansionIndex].name == name) {

                g_currentMansionIndex++;

                if (g_currentMansionIndex >= g_mansions.size()) {
                    g_checkInProgress = false;
                    samp::RefChat()->AddMessage(0xFFFFFFFF, "Проверка всех особняков завершена.");
                    return;
                }
                auto& nextMansion = g_mansions[g_currentMansionIndex];
                std::string tpCmd = formatString("/pos %.4f %.4f %.4f", nextMansion.x, nextMansion.y, nextMansion.z);

                std::vector<char> tmp(tpCmd.begin(), tpCmd.end());
                tmp.push_back('\0');
                auto* input = samp::RefInputBox();
                if (input) {
                    input->Send(tmp.data());
                }
            }
            break;
        }
    }
}

 void cmd_startcheck() {
     if (g_checkInProgress) return samp::RefChat()->AddMessage(0xFFFFFFFF, "Проверка уже идёт.");
     g_checkInProgress = true;
     g_currentMansionIndex = 0;
     samp::RefChat()->AddMessage(0xFFFFFFFF, "Начинаем проверку особняков.");
     if (!g_mansions.empty()) {
         auto& m = g_mansions[g_currentMansionIndex];
         std::string tpCmd = formatString("/pos %.4f %.4f %.4f", m.x, m.y, m.z);
         std::vector<char> tmp(tpCmd.begin(), tpCmd.end());
         tmp.push_back('\0');
         auto* input = samp::RefInputBox();
         if (input) {
             input->Send(tmp.data());
         }
     }
 }
 void cmd_check_mansions_Controls() {
     samp::RefChat()->AddMessage(0xFFFFFFFF, "=== Особняки ===");
     for (const auto& m : g_mansions) {
         std::string msg;

         if (m.controller.empty())
             msg = m.name + " -> ?";
         else
             msg = m.name + " -> " + m.controller;

         samp::RefChat()->AddMessage(0xFFAAAAFF, msg.c_str());
     }

     samp::RefChat()->AddMessage(0xFFFFFFFF, "================");
 }

void Plugin::mainloop(const decltype(hookCTimerUpdate)& hook) {
    static bool inited = false;
    if (!inited && samp::RefNetGame() != nullptr && samp::RefChat() != nullptr && rakhook::initialize()) {
        samp::RefInputBox()->AddCommand("spveh", [](const char* arg) {
            HandleVehicleCommand(arg, "spcar", "Использование /spveh [ID игрока]");
            });
        samp::RefInputBox()->AddCommand("tpcar", [](const char* arg) {
            HandleVehicleCommand(arg, "getcar", "Использование /tpcar [ID игрока]");
            });
        samp::RefInputBox()->AddCommand("tflip", [](const char* arg) {
            HandleVehicleCommand(arg, "flip", "Использование /tflip [ID игрока]");
            });
        samp::RefInputBox()->AddCommand("tdoc", [](const char* arg) {
            HandleVehicleCommand(arg, "acarpass", "Использование /tdoc [ID игрока]");
            });
        samp::RefInputBox()->AddCommand("fix", [](const char* arg) {
            HandleVehicleCommand(arg, "fixcar", "Использование /fix [ID игрока]");
            });
        samp::RefInputBox()->AddCommand("schecko", [](const char* arg) {
            cmd_startcheck();  
            });
        samp::RefInputBox()->AddCommand("checko", [](const char* arg) {
            cmd_check_mansions_Controls();
            });

        StringCompressor::AddReference();
        rakhook::on_receive_rpc += std::bind(&PluginRPC::Create3DTextLabel, &RPC, _1, _2);
        inited = true;
    }

    return hook.get_trampoline()();
}