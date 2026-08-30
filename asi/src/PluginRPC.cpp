#include "PluginRPC.h"
#include "Plugin.h"
#include <RakNet/StringCompressor.h>
#include <regex>

void updateMansionController(const std::string& text);


bool PluginRPC::Create3DTextLabel(unsigned char& id, RakNet::BitStream* bs)
{
    if (id != 36)
        return true;

    uint16_t labelId;
    uint32_t color;
    float x, y, z, drawDistance;
    uint8_t testLOS;
    uint16_t attachedPlayer, attachedVehicle;

    bs->Read(labelId);
    bs->Read(color);
    bs->Read(x);
    bs->Read(y);
    bs->Read(z);
    bs->Read(drawDistance);
    bs->Read(testLOS);
    bs->Read(attachedPlayer);
    bs->Read(attachedVehicle);

    char text[4096]{};
    if (!StringCompressor::Instance()->DecodeString(text, sizeof(text), bs))
        return true;
    std::string raw(text);
    std::regex clr("\\{[0-9A-Fa-f]{6}\\}");
    raw = std::regex_replace(raw, clr, "");
    std::regex nl("[\r\n]+");
    std::string normalizedText = std::regex_replace(raw, nl, ", ");
   updateMansionController(normalizedText);

    return true;
}
