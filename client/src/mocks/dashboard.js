import { configSeuil, documents, missions, user } from './db.js'

// Vue simulee de GET /api/dashboard : une projection du jeu de donnees commun
// (src/mocks/db.js), pas une copie, les lignes sont les memes que celles
// servies aux pages Missions et Documents.
export const dashboardMock = {
  user,
  configSeuil,
  missions,
  documents,
}

export default dashboardMock
