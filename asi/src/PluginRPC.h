#pragma once

#include <RakNet/BitStream.h>

class PluginRPC {
public:
    bool Create3DTextLabel(unsigned char& id, RakNet::BitStream* bs);
};