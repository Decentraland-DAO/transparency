export interface TransactionDetails {
  count: number
  total: number
}

export interface FeeDetails {
  date: Date
  fee: number
}

export interface APITransactions {
  updated_at: Date
  items: TransactionItem[]
}

export interface TransactionItem {
  block_signed_at: Date
  block_height: number
  tx_hash: string
  tx_offset: number
  successful: boolean
  from_address: string
  from_address_label: null
  to_address: string
  to_address_label: AddressLabel | null
  value: string
  value_quote: number
  gas_offered: number
  gas_spent: number
  gas_price: number
  fees_paid: null | string
  gas_quote: number
  gas_quote_rate: number
  log_events: LogEvent[]
}

export interface LogEvent {
  block_signed_at: Date
  block_height: number
  tx_offset: number
  log_offset: number
  tx_hash: string
  raw_log_topics: string[]
  sender_contract_decimals: number
  sender_name: SenderName | null
  sender_contract_ticker_symbol: SenderContractTickerSymbol | null
  sender_address: string
  sender_address_label: AddressLabel | null
  sender_logo_url: string
  raw_log_data: null | string
  decoded: Decoded | null
}

export interface Decoded {
  name: DecodedName
  signature: string
  params: Param[] | null
}

export enum DecodedName {
  Approval = "Approval",
  BidAccepted = "BidAccepted",
  Conversion = "Conversion",
  DODOSwap = "DODOSwap",
  Deposit = "Deposit",
  Error = "Error",
  EtherReceival = "EtherReceival",
  ExecuteTrade = "ExecuteTrade",
  ExecutionSuccess = "ExecutionSuccess",
  FeeDistributed = "FeeDistributed",
  Fill = "Fill",
  InvocationSuccess = "InvocationSuccess",
  KyberTrade = "KyberTrade",
  NewPeriod = "NewPeriod",
  NewTransaction = "NewTransaction",
  OrderFilledRFQ = "OrderFilledRFQ",
  RoyaltyPayment = "RoyaltyPayment",
  ScriptResult = "ScriptResult",
  Swap = "Swap",
  Swapped = "Swapped",
  Sync = "Sync",
  TakerAsk = "TakerAsk",
  TakerBid = "TakerBid",
  TokenExchange = "TokenExchange",
  TokenRateUpdate = "TokenRateUpdate",
  TradeExecute = "TradeExecute",
  Transfer = "Transfer",
  VaultDeposit = "VaultDeposit",
  VaultTransfer = "VaultTransfer",
  Withdrawal = "Withdrawal",
}

export interface Param {
  name: ParamName
  type: Type
  indexed: boolean
  decoded: boolean
  value: ValueElement[] | boolean | null | string
}

export enum ParamName {
  ActualDestAmount = "actualDestAmount",
  ActualSrcAmount = "actualSrcAmount",
  Amount = "amount",
  Amount0 = "amount0",
  Amount0In = "amount0In",
  Amount0Out = "amount0Out",
  Amount1 = "amount1",
  Amount1In = "amount1In",
  Amount1Out = "amount1Out",
  AmountIn = "amountIn",
  AmountOut = "amountOut",
  Bidder = "_bidder",
  BoughtID = "bought_id",
  BurnAmtWei = "burnAmtWei",
  Buyer = "buyer",
  Collection = "collection",
  ConversionFee = "_conversionFee",
  Currency = "currency",
  CustomPlatformFeeWei = "customPlatformFeeWei",
  Dest = "dest",
  DestAddress = "destAddress",
  Dst = "dst",
  DstReceiver = "dstReceiver",
  DstToken = "dstToken",
  E2TIDS = "e2tIds",
  E2TRates = "e2tRates",
  E2TSrcAmounts = "e2tSrcAmounts",
  Entity = "entity",
  EthWeiValue = "ethWeiValue",
  Executor = "executor",
  Fee = "_fee",
  FeeRecipientAddress = "feeRecipientAddress",
  From = "from",
  FromAmount = "_fromAmount",
  FromToken = "_fromToken",
  Hash = "hash",
  ID = "_id",
  Incoming = "incoming",
  Input = "input",
  Liquidity = "liquidity",
  Maker = "maker",
  MakerAddress = "makerAddress",
  MakerAssetData = "makerAssetData",
  MakerAssetFilledAmount = "makerAssetFilledAmount",
  MakerFeePaid = "makerFeePaid",
  MakingAmount = "makingAmount",
  NameAmount = "_amount",
  NameFromAmount = "fromAmount",
  NameFromToken = "fromToken",
  NamePrice = "price",
  NameToAmount = "toAmount",
  NameToToken = "toToken",
  NameTokenID = "tokenId",
  NameTrader = "trader",
  NetworkFeeWei = "networkFeeWei",
  NumOperations = "numOperations",
  OrderHash = "orderHash",
  OrderNonce = "orderNonce",
  Owner = "owner",
  Payment = "payment",
  PeriodEnds = "periodEnds",
  PeriodID = "periodId",
  PeriodStarts = "periodStarts",
  PlatformFeeBps = "platformFeeBps",
  PlatformFeeWei = "platformFeeWei",
  PlatformWallet = "platformWallet",
  PoolID = "poolId",
  Price = "_price",
  RateD = "_rateD",
  RateN = "_rateN",
  Reason = "reason",
  RebatePercentBpsPerWallet = "rebatePercentBpsPerWallet",
  RebateWallets = "rebateWallets",
  RebateWei = "rebateWei",
  Receiver = "receiver",
  Recipient = "recipient",
  Reference = "reference",
  Reserve0 = "reserve0",
  Reserve1 = "reserve1",
  Result = "result",
  Return = "_return",
  ReturnAmount = "returnAmount",
  ReturnData = "returnData",
  RewardWei = "rewardWei",
  RoyaltyRecipient = "royaltyRecipient",
  Script = "script",
  Seller = "_seller",
  Sender = "sender",
  SenderAddress = "senderAddress",
  SmartToken = "_smartToken",
  SoldID = "sold_id",
  Spender = "spender",
  SpentAmount = "spentAmount",
  SqrtPriceX96 = "sqrtPriceX96",
  Src = "src",
  SrcToken = "srcToken",
  Strategy = "strategy",
  T2EIDS = "t2eIds",
  T2ERates = "t2eRates",
  T2ESrcAmounts = "t2eSrcAmounts",
  Taker = "taker",
  TakerAddress = "takerAddress",
  TakerAssetData = "takerAssetData",
  TakerAssetFilledAmount = "takerAssetFilledAmount",
  TakerFeePaid = "takerFeePaid",
  Tick = "tick",
  To = "to",
  ToAmount = "_toAmount",
  ToToken = "_toToken",
  Token = "token",
  Token1 = "_token1",
  Token2 = "_token2",
  TokenAddress = "_tokenAddress",
  TokenID = "_tokenId",
  TokenIn = "tokenIn",
  TokenOut = "tokenOut",
  TokensBought = "tokens_bought",
  TokensSold = "tokens_sold",
  Trader = "_trader",
  TransactionID = "transactionId",
  TxHash = "txHash",
  Value = "value",
  Wad = "wad",
}

export enum Type {
  Address = "address",
  Bool = "bool",
  Bytes = "bytes",
  Bytes32 = "bytes32",
  Int24 = "int24",
  Int256 = "int256",
  String = "string",
  TypeAddress = "address[]",
  TypeBytes32 = "bytes32[]",
  TypeUint256 = "uint256[]",
  Uint112 = "uint112",
  Uint128 = "uint128",
  Uint160 = "uint160",
  Uint256 = "uint256",
  Uint64 = "uint64",
}

export interface ValueElement {
  value: string
  typeAsString: Type
  bitSize?: number
}

export enum AddressLabel {
  BancorBNT = "Bancor (BNT)",
  DaiStablecoinDAI = "Dai Stablecoin (DAI)",
  DecentralandDAOAgent = "Decentraland: DAO Agent",
  DecentralandDAOCommunity = "Decentraland: DAO Community",
  DecentralandLANDLAND = "Decentraland LAND (LAND)",
  DecentralandMANA = "Decentraland (MANA)",
  EstateEST = "Estate (EST)",
  LooksRareExchange = "LooksRare: Exchange",
  TetherUSDUSDT = "Tether USD (USDT)",
  The0XExchangeV21 = "0x: Exchange v2.1",
  The1InchV4Router = "1inch v4: Router",
  USDCoinUSDC = "USD Coin (USDC)",
  WrappedBTCWBTC = "Wrapped BTC (WBTC)",
  WrappedEther = "Wrapped Ether",
}

export enum SenderContractTickerSymbol {
  Bnt = "BNT",
  DCLEstateLandBalance = "DCL_ESTATE_LAND_BALANCE",
  DCLLandBalance = "DCL_LAND_BALANCE",
  DLP = "DLP",
  Dai = "DAI",
  Dclcmmntcntst = "DCLCMMNTCNTST",
  Dclczmrcnrymtz = "DCLCZMRCNRYMTZ",
  Dcldgsmmr2020 = "DCLDGSMMR2020",
  Dclens = "DCLENS",
  Dcllnch = "DCLLNCH",
  Dcltchtrblmrc0Mtc = "DCLTCHTRBLMRC0MTC",
  Dcltr = "DCLTR",
  Dclxmas2020 = "DCLXMAS2020",
  Est = "EST",
  Land = "LAND",
  Mana = "MANA",
  Slp = "SLP",
  UniV2 = "UNI-V2",
  Usdc = "USDC",
  Usdt = "USDT",
  Wbtc = "WBTC",
  Weth = "WETH",
}

export enum SenderName {
  BancorNetworkToken = "Bancor Network Token",
  DCLAtariLaunch = "dcl://atari_launch",
  DCLCommunityContest = "dcl://community_contest",
  DCLCzMercenaryMtz = "dcl://cz_mercenary_mtz",
  DCLDCLLaunch = "dcl://dcl_launch",
  DCLDgSummer2020 = "dcl://dg_summer_2020",
  DCLRegistrar = "DCL Registrar",
  DCLTechTribalMarc0Matic = "dcl://tech_tribal_marc0matic",
  DCLXmas2020 = "dcl://xmas_2020",
  DLP3058Ef90 = "DLP_3058ef90",
  DaiStablecoin = "Dai Stablecoin",
  DecentralandEstateLandBalance = "Decentraland Estate Land Balance",
  DecentralandLAND = "Decentraland LAND",
  DecentralandLandBalance = "Decentraland Land Balance",
  DecentralandMANA = "Decentraland MANA",
  Estate = "Estate",
  SushiSwapLPToken = "SushiSwap LP Token",
  TetherUSD = "Tether USD",
  USDCoin = "USD Coin",
  UniswapV2 = "Uniswap V2",
  WrappedBTC = "Wrapped BTC",
  WrappedEther = "Wrapped Ether",
}
