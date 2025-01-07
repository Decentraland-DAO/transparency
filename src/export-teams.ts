import { CurationCommittee, DAOCommittee, DAOCouncilCommittee, RevocationCommittee, SABCommittee } from './entities/Teams'
import { reportToRollbarAndThrow, saveToJSON } from './utils'

async function main() {
  const data = {
    'committees': [
      SABCommittee.toJson(),
      DAOCommittee.toJson(),
      CurationCommittee.toJson(),
      RevocationCommittee.toJson(),
      DAOCouncilCommittee.toJson()
    ]
  }

  saveToJSON('teams.json', data)
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))
