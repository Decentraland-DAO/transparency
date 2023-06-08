/*
** NOTICE: Addresses must be in lowercase
*/

import { DAOCommittee } from "../entities/Teams"

export const DAO_COMMITTEE_ADDRESSES = [
  '0x521b0fef9cdcf250abaf8e7bc798cbe13fa98692',
  ...DAOCommittee.getMemberAddresses()
]

export const SWAP_CONTRACTS = [
  '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
  '0xc176761d388caf2f56cf03329d82e1e7c48ae09c',
  '0xb3c839dbde6b96d37c56ee4f9dad3390d49310aa',
  '0x1111111254fb6c44bac0bed2854e76f90643097d',
  '0x27239549dd40e1d60f5b80b0c4196923745b1fd2',
  '0x3058ef90929cb8180174d74c507176cca6835d73',
  '0x220bda5c8994804ac96ebe4df184d25e5c2196d4',
  '0x5f5207df64b0f7ed56bf0b61733d3be8795f4e5a',
  '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
  '0x1bec4db6c3bc499f3dbf289f5499c30d541fec97',
  '0xc3d03e4f041fd4cd388c549ee2a29a9e5075882f',
  '0x06da0fd433c1a5d7a4faa01111c044910a184553',
  '0x11b1f53204d03e5529f09eb3091939e4fd8c9cf3',
  '0x2ec255797fef7669fa243509b7a599121148ffba',
  '0x6d51fdc0c57cbbff6dac4a565b35a17b88c6ceb5',
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f',
  '0x288931fa76d7b0482f0fd0bca9a50bf0d22b9fef',
  '0x8661ae7918c0115af9e3691662f605e9c550ddc9',
  '0xd9ed2b5f292a0e319a04e6c1aca15df97705821c',
  '0x2057cfb9fd11837d61b294d514c5bd03e5e7189a',
  '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36',
  '0x11b815efb8f581194ae79006d24e0d814b7697f6',
  '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
  '0xdab8c0126102db3b5d678475e7f5ff6fbd390a54',
]

export const SECONDARY_SALE_CONTRACTS = [
  '0x8e5660b4ab70168b5a6feea0e0315cb49c8cd539',
  '0x388fe75d523963c68f5741700403ca285bda5225',
  '0xf9f68fc85cc9791d264477d1bb1aa649f022e9dc',
  '0xcdd598d1588503e1609ae1e50cdb74473ffb0090',
  '0xb9f46b3c2e79238e01f510a60846bf5dcc981bc3',
  '0x1ea027314c055705ac09d9bc742e6eacc7a1ceb2',
  '0x2a9da28bcbf97a8c008fd211f5127b860613922d',
  '0x7c6eda316fc4abf1efaba8015e6ff04b241fcb35',
]

export const CURATION_FEE_CONTRACTS = [
  '0x0babda04f62c549a09ef3313fe187f29c099ff3c',
  '0x9d32aac179153a991e832550d9f96441ea27763a',
]

export const WEARABLE_CONTRACTS = [
  '0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd', // ExclusiveMasksCollection
  '0xc1f4b0eea2bd6690930e6c66efd3e197d620b9c2', // Halloween2019Collection
  '0xc3af02c0fd486c8e9da5788b915d6fff3f049866', // Xmas2019Collection
  '0xf64dc33a192e056bb5f0e5049356a0498b502d50', // MCHCollection
  '0x32b7495895264ac9d0b12d32afd435453458b1c6', // CommunityContestCollection
  '0xd35147be6401dcb20811f2104c33de8e97ed6818', // DCLLaunchCollection
  '0x3163d2cfee3183f9874e2869942cc62649eeb004', // DCGCollection
  '0x201c3af8c471e5842428b74d1e7c0249adda2a92', // StaySafeCollection
  '0x6a99abebb48819d2abe92c5e4dc4f48dc09a3ee8', // Moonshot2020Collection
  '0x1e1d4e6262787c8a8783a37fee698bd42aa42bec', // DappcraftMoonminerCollection
  '0xbf53c33235cbfc22cef5a61a83484b86342679c5', // DGSummer2020Collection
  '0x75a3752579dc2d63ca229eebbe3537fbabf85a12', // PMOuttathisworldCollection
  '0x574f64ac2e7215cba9752b85fc73030f35166bc0', // DgtbleHeadspaceCollection
  '0x34ed0aa248f60f54dd32fbc9883d6137a491f4f3', // WonderzoneMeteorchaserCollection
  '0xa8ee490e4c4da48cc1653502c1a77479d4d818de', // BinanceUsCollection
  '0x09305998a531fade369ebe30adf868c96a34e813', // PMDreamverseEminence
  '0x24d538a6265b006d4b53c45ba91af5ef60dca6cb', // CybermikeCyberSoldier
  '0xe7a64f6a239ed7f5bf18caa1ce2920d0c1278129', // DCMeta
  '0x5df4602e7f38a91ea7724fc167f0c67f61604b1e', // WZWonderbot
  '0x7038e9d2c6f5f84469a84cf9bc5f4909bb6ac5e0', // DGFall2020
  '0x30d3387ff3de2a21bef7032f82d00ff7739e403c', // MFSammichgamer
  '0xb5d14052d1e2bce2a2d7459d0379256e632b855d', // SugarclubYumi
  '0x54266bcf2ffa841af934f003d144957d5934f3ab', // EtheremonWearables
  '0x60d8271c501501c4b8cd9ed5343ac59d1b79d993', // MLPekingopera
  '0x90958d4531258ca11d18396d4174a007edbc2b42', // ChinaFlying
  '0x480a0f4e360e8964e68858dd231c2922f1df45ef', // TechTribalMarc0matic
  '0x5cf39e64392c615fd8086838883958752a11b486', // DigitalAlchemy
  '0xc3ca6c364b854fd0a653a43f8344f8c22ddfdd26', // CZMercenaryMTZ
  '0xb96697fa4a3361ba35b774a42c58daccaad1b8e1', // WonderzoneSteampunk
  '0x102daabd1e9d294d4436ec4c521dce7b1f15499e', // DCNiftyblocksmith
  '0xfeb52cbf71b9adac957c6f948a6cf9980ac8c907', // Halloween2020Collection
  '0xecf073f91101ce5628669c487aee8f5822a101b1', // Xmas2020Collection
  '0x1a57f6afc902d25792c53b8f19b7e17ef84222d5', // MemeDontBuyThis
  '0xffc5043d9a00865d089d5eefa5b3d1625aec6763', // ReleaseTheKraken
  '0xe1ecb4e5130f493551c7d6df96ad19e5b431a0a9', // 3LAUBasics
  '0xdd9c7bc159dacb19c9f6b9d7e23948c87aa2397f', // XmashUp2020
  '0x0b1c6c75d511fae05e7dc696f4cf14129a9c43c9', // MLLiondance
  '0x4c290f486bae507719c562b6b524bdb71a2570c9', // AtariLaunch
  '0x6b47e7066c7db71aa04a1d5872496fe05c4c331f', // RTFKTXAtari
  '0x68e139552c4077ce5c9ab929c7e18ca721ffff00', // RACBasics
  '0xc82a864a94db3550bc71fcb4ce07228bcec21f1a', // WinklevossCapital
  '0x51e0b1afe5da0c038fc93a3fc8e11cf7a238b40b', // DGAtariDillonFranci
]

export const CURATORS_PAYMENT_ADDRESSES = [
  '0x5d7846007c1dd6dca25d16ce2f71ec13bcdcf6f0',
  '0x716954738e57686a08902d9dd586e813490fee23',
  '0xc958f028d1b871ab2e32c2abda54f37191efe0c2',
  '0x82d54417fc69681dc74a6c0c68c6dbad5a2857b9',
  '0x9db59920d3776c2d8a3aa0cbd7b16d81fcab0a2b',
  '0x91e222ed7598efbcfe7190481f2fd14897e168c8',
  '0x6cdfdb9a4d99f16b5607cab1d00c792206db554e',
  '0x862f109696d7121438642a78b3caa38f476db08b',
  '0xc8ad6322821b51da766a4b2a82b39fb72b53d276',
  '0xa8c7d5818a255a1856b31177e5c96e1d61c83991',
  '0x336685bb3a96e13b77e909d7c52e8afcff1e859e',
  '0x41eb5f82af60873b3c14fedb898a1712f5c35366',
  '0x470c33abd57166940095d59bd8dd573cbae556c3',
  '0x1dec5f50cb1467f505bb3ddfd408805114406b10',
  '0x5ce9fb617333b8c5a8f7787710f7c07002cb3516',
  '0x805797df0c0d7d70e14230b72e30171d730da55e'
]

export const GRANTS_REVENUE_ADDRESSES = [
  '0xf22b4b9175f5b1a2730e84f5c2360a029a333fde', // https://governance.decentraland.org/proposal/?id=29b3a3a0-74fd-11ed-a9bf-f772a12a0556
]