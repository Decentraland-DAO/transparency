import { DCLMember } from '../interfaces/Members'

class Committee {
  private readonly name: string
  private readonly description: string
  private readonly size: number
  private readonly members: DCLMember[]

  constructor(name: string, description: string, size: number, members: DCLMember[]) {
    this.name = name
    this.description = description
    this.size = size
    this.members = members
  }

  public toJson() {
    return {
      name: this.name,
      description: this.description,
      size: this.size,
      members: this.members
    }
  }

  public getMemberAddresses(): string[] {
    return this.members.map(member => member.address)
  }
}

export const SABCommittee = new Committee(
  'Security Advisory Board',
  'Responsable to overview the sensible operations of the DAO, with the power to halt operations initiated by the DAO Committee or the Community. They advise in the best course of action for technical operations involving the DAO\'s smart contracts.',
  5,
  [
    {
      address: '0xbcac4dafb7e215f2f6cb3312af6d5e4f9d9e7eda',
      name: 'Ignacio',
      avatar: 'https://decentraland.org/images/male.png'
    },
    {
      address: '0xfc4ef0903bb924d06db9cbaba1e4bda6b71d2f82',
      name: 'Ariel',
      avatar: 'https://decentraland.org/images/male.png'
    },
    {
      address: '0x48850327b81d0c924ad212891c7223c2ea5cd426',
      name: 'Agustin',
      avatar: 'https://decentraland.org/images/male.png'
    },
    {
      address: '0x42ebd2ab698ba74eec1d2a81c376ea2c38c05249',
      name: 'Brett',
      avatar: 'https://decentraland.org/images/male.png'
    },
    {
      address: '0x759605f5497c578988d167e2f66d4955d35e77af',
      name: 'Kyllian',
      avatar: 'https://peer.decentraland.org/content/contents/bafkreig4ckv7k7ga7niptdw2wsv2u565r6hb5dwzprhavoa3yyoftjrvni'
    }
  ]
)

export const DAOCouncilCommittee = new Committee(
  'DAO Council',
  'Responsible for providing strategic guidance to the DAO, reviewing and approving annual budgets and treasury management strategies, and overseeing the execution of key projects through the DAO\'s executive arm, DCL Regenesis Labs.',
  5,
  [
    {
      address: '0x5b5cc427c1D81Db4F94DE4d51D85ce122D63E244',
      name: 'Fehz',
      avatar: 'https://profile-images-bucket-43d0c58.s3.us-east-1.amazonaws.com/v1/entities/bafkreiexuj64wzcld442sppax3dsijnfev6adesfbulr7s2umpqvtk7a3u/face.png'
    },
    {
      address: '0x8DD060AD7f867ad890490fd87657c1b7e63C622f',
      name: 'Jungle',
      avatar: 'https://profile-images-bucket-43d0c58.s3.us-east-1.amazonaws.com/v1/entities/bafkreid6eptd2cjjq3tqewmlyknuhbjvselr644royhpav7hamjr7qaqiq/face.png'
    },
    {
      address: '0xd6eFf8F07cAF3443A1178407d3de4129149D6eF6',
      name: 'Canessa',
      avatar: 'https://profile-images-bucket-43d0c58.s3.us-east-1.amazonaws.com/v1/entities/bafkreicvsh4txf2k6kolgubd5f774gzqoebclliko74k3plib7by2uvgkq/face.png'
    },
    {
      address: '0x3f6b1d01b6823ab235fc343069b62b6472774cd1',
      name: 'MetaRyuk',
      avatar: 'https://decentraland.org/images/male.png'
    },
    {
      address: '0x7a7280E299B79b7BD14D7501e3a03a0B77541622',
      name: 'Monotributista',
      avatar: 'https://profile-images-bucket-43d0c58.s3.us-east-1.amazonaws.com/v1/entities/bafkreifh2g5ouyjxu2lqif6bymkq7vxdmdpv4sgvokbwcaygn2uzh3stve/face.png'
    }
  ]
)

export const CurationCommittee = new Committee(
  'Wearable Curation Committee',
  'Responsible for reviewing new wearable submissions ensuring they are glitch-free and compliant with the design guidelines. They also rise warnings about IP infringement and violent content.',
  15,
  [
    {
      address: '0x8938d1f65abe7750b0777206ee26c974a6721194',
      name: 'Shibu',
      avatar: 'https://peer.decentraland.org/content/contents/Qma12zSYqq3zN6kRdVG57fE1L1ejwFaGVoWesWvJQ5nwsQ'
    },
    {
      address: '0x7a3891acf4f3b810992c4c6388f2e37357d7d3ab',
      name: 'JP',
      avatar: 'https://peer.decentraland.org/content/contents/QmSP9nM8bWDCWnSZry7bveufHyXAYNc7WKmkcvMdfd6vy7'
    },
    {
      address: '0x5d7846007c1dd6dca25d16ce2f71ec13bcdcf6f0',
      name: 'Lau',
      avatar: 'https://peer.decentraland.org/content/contents/QmPKxjopunHgfp9ezgTUdpDTNv6EWuJnvijMqixrSM7tGE'
    },
    {
      address: '0x716954738e57686a08902d9dd586e813490fee23',
      name: 'Hirotokai',
      avatar: 'https://peer.decentraland.org/content/contents/QmToWDDeMkpnpjZq2wQzE4JYLGSHkfL3QVQkHNk97ZsXv7'
    },
    {
      address: '0x82d54417fc69681dc74a6c0c68c6dbad5a2857b9',
      name: 'Malloy',
      avatar: 'https://peer.decentraland.org/content/contents/QmRUop9sik6BmusbhYHymeMwyntiZwECexPksTJNzFu5jB'
    },
    {
      address: '0x91e222ed7598efbcfe7190481f2fd14897e168c8',
      name: 'Chestnutbruze',
      avatar: 'https://peer.decentraland.org/content/contents/QmdAsk9UwnZZgSmcUjY1rb1WeeGRiPznmyqQCXqesHyqx7'
    },
    {
      address: '0x5e382071464a6f9ea29708a045983dc265b0d86d',
      name: 'Sango',
      avatar: 'https://peer.decentraland.org/content/contents/QmU4qcD3x92H5jQ8djuFE8SPYjcLXpQnVELuqhdmR5oVUy'
    },
    {
      address: '0xc8ad6322821b51da766a4b2a82b39fb72b53d276',
      name: 'Grimey',
      avatar: 'https://peer.decentraland.org/content/contents/QmevxQr6eBno2s5yjNpXhyTANx2gQ8xKr3JzcvkTL5DqYA'
    },
    {
      address: '0xa8c7d5818a255a1856b31177e5c96e1d61c83991',
      name: 'AndreusAs',
      avatar: 'https://peer.decentraland.org/content/contents/QmaX2fHvNWNbsGw4sLbaArip9HNk4QjEEdWB7N9uupm2cM'
    },
    {
      address: '0x336685bb3a96e13b77e909d7c52e8afcff1e859e',
      name: 'Mitch Todd',
      avatar: 'https://peer.decentraland.org/content/contents/QmXKhoqxauJRUQsghcXULzNBkwyEVw6DFrRhNxmVTnFy8y'
    },
    {
      address: '0x41eb5f82af60873b3c14fedb898a1712f5c35366',
      name: 'Kristian',
      avatar: 'https://peer.decentraland.org/content/contents/QmTdAJJ2ccL75GUp3kdjkkUvAtqPtEkHhDqXJV57bFAf8V'
    },
    {
      address: '0x470c33abd57166940095d59bd8dd573cbae556c3',
      name: 'James Guard',
      avatar: 'https://peer.decentraland.org/content/contents/Qmc8Ff1FtvnkDYY3JCBjyZgT5okeudJPUhF89RtG62oQhV'
    },
    {
      address: '0x1dec5f50cb1467f505bb3ddfd408805114406b10',
      name: 'Fabeeo Breen',
      avatar: 'https://peer.decentraland.org/content/contents/QmQAUCheYJyaj7T2Uk9rwAqVYabDxpm1AiMxGD4KgLosmu'
    },
    {
      address: '0x5ce9fb617333b8c5a8f7787710f7c07002cb3516',
      name: 'Yannakis',
      avatar: 'https://peer.decentraland.org/content/contents/QmeobCJZze79Nye5KCaUtAfZ7Z1wkE9Z7youUaDG4TzqbV'
    },
    {
      address: '0x967fb0c36e4f5288f30fb05f8b2a4d7b77eaca4b',
      name: 'KJWalker',
      avatar: 'https://peer.decentraland.org/content/contents/bafkreidrquum4l7dymzhodvzctjaj2odhtp6lxjjn6rkoefy5jr6qycsey'
    }
  ]
)