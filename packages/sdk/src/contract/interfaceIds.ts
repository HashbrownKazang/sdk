import type { Hex } from 'viem'

export const interfaceIds = {
  ISoundEditionV1: '0x50899e54',
  ISoundEditionV1_2: '0xa176eca6',
  IMinterModule: '0x37c74bd8',
  IFixedPriceSignatureMinter: '0xa61bd96f',
  IMerkleDropMinter: '0x89691c4c',
  IEditionMaxMinter: '0xa7ea8688',
  IRangeEditionMinter: '0x4d4a2e35',
  IMinterModuleV2: '0xf8ccd08e',
  IFixedPriceSignatureMinterV2: '0x0f713f15',
  IMerkleDropMinterV2: '0x5e9a2e5f',
  IEditionMaxMinterV2: '0x6ee3f258',
  IRangeEditionMinterV2: '0x84435ae5',
  IMinterModuleV2_1: '0x09d98f1e',
  IFixedPriceSignatureMinterV2_1: '0x32c3f8e7',
  IMerkleDropMinterV2_1: '0x6328e9ad',
  IEditionMaxMinterV2_1: '0x535135aa',
  IRangeEditionMinterV2_1: '0xb9f19d17',
  ISAM: '0xa3c2dbc7',
  ISAMV1_1: '0x212580d2',
} as const satisfies Record<string, Hex>
