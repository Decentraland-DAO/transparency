import { CurationCommittee, DAOCouncilCommittee, SABCommittee } from './entities/Teams'
import { reportToRollbarAndThrow, saveToJSON } from './utils'

async function main() {
  const data = {
    'committees': [
      SABCommittee.toJson(),
      CurationCommittee.toJson(),
      DAOCouncilCommittee.toJson()
    ]
  }

  saveToJSON('teams.json', data)
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))
