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
      name: 'Brett',
      avatar: 'https://decentraland.org/images/male.png'
    },
    {
      address: '0x48850327b81d0c924ad212891c7223c2ea5cd426',
      name: 'Kyllian',
      avatar: 'https://peer.decentraland.org/content/contents/bafkreig4ckv7k7ga7niptdw2wsv2u565r6hb5dwzprhavoa3yyoftjrvni'
    },
    {
      address: '0x42ebd2ab698ba74eec1d2a81c376ea2c38c05249',
      name: 'Agustin',
      avatar: 'https://decentraland.org/images/male.png'
    },
    {
      address: '0x759605f5497c578988d167e2f66d4955d35e77af',
      name: 'Ariel',
      avatar: 'https://decentraland.org/images/male.png'
    }
  ]
)

export const DAOCommittee = new Committee(
  'DAO Committee',
  'Their principal responsibility is to enact binding proposals on-chain like listing Point of Interests, sending Grants, and any other operations involving the DAO\'s smart contracts.',
  3,
  [
    {
      address: '0xbef99f5f55cf7cdb3a70998c57061b7e1386a9b0',
      name: 'Kyllian',
      avatar: 'https://peer.decentraland.org/content/contents/bafkreig4ckv7k7ga7niptdw2wsv2u565r6hb5dwzprhavoa3yyoftjrvni'
    },
    {
      address: '0x88013D7eD946dD8292268a6FF69165a97A89a639',
      name: 'Tobik',
      avatar: 'https://peer.decentraland.org/content/contents/bafkreif25t6mav5bgkajwr6l6wptzh5lkmonuw7pzricrin6fyhoazfruu'
    },
    {
      address: '0xd6c957f9a6411f35d01baae2658758f277408878',
      name: 'RizkGh',
      avatar: 'https://peer.decentraland.org/content/contents/bafkreidnd3mgh25roc6g4scwkidkbo5pdr2w3lqpjecrnadx6dns72ojdy'
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

export const RevocationCommittee = new Committee(
  'Revocation Committee',
  'Responsible for reviewing cases raised by the community regarding Grants Program that raise concerns. After an assessment, they decide if a Grant has to be revoked or not. They also make recommendations for changes in the Grants Program when identifying improvements.',
  4,
  [
    {
      address: '0x895Be97bDb9F8a244c472B18EA96DeE39ddf8fe5',
      name: 'dax',
      avatar: 'https://peer.decentraland.org/content/contents/bafkreih7ul7ovk2s6girhpvqh5nyk32k7pekdwwlqjbl2iigednwxsfafy'
    },
    {
      address: '0x05060Fa97e54a812d1E15cEc6c34e79f74eBD0b3',
      name: 'MetaDoge',
      avatar: 'https://peer.decentraland.org/content/contents/bafkreihwsyuhzujztiq34whajfp4qxk4ava3okzxge2fiviie5vov4tp2u'
    },
    {
      address: '0x9937E3e274be96a624d7Cd00F384EB71c741Dd1b',
      name: 'Maryana',
      avatar: 'https://peer.decentraland.org/content/contents/bafkreidyp7cslipz3l7wrr2paothwsqreokm5se4vq3qyrey67olltcgi4'
    },
    {
      address: '0x1e105bb213754519903788022b962fe2B9C4B263',
      name: 'BayBackner',
      avatar: 'https://peer.decentraland.org/content/contents/bafkreieonpaf25iryrxqk5yivvathsga7n2idbcbpphpsveqiblpcs3jwu'
    }
  ]
)