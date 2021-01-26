const express = require('express')
const {
  getGames,
  getGame,
  addGame,
  updateGame,
  deleteGame,
  requestToJoinGame,
  getRequestsToJoinGame,
  getRequestToJoinGame,
  acceptRequestToJoinGame,
  denyRequestToJoinGame,
  getUsers,
  getUser,
  deleteUser,
} = require('../controllers/gamesController')

const Game = require('../models/gameModel')
const advancedResults = require('../middleware/advancedResults')
const { protect, authorize } = require('../middleware/auth')
const router = express.Router({ mergeParams: true })

router
  .route('/')
  .get(
    advancedResults(Game, { path: 'game', select: 'name description' }),
    getGames
  )

router.route('/group/:groupId').post(protect, addGame).get(getGames)
router
  .route('/:id')
  .get(protect, getGame)
  .put(protect, updateGame)
  .delete(protect, deleteGame)
router
  .route('/:id/request')
  .post(protect, requestToJoinGame)
  .get(protect, getRequestsToJoinGame)

router
  .route('/:gameId/request/:requestId')
  .get(protect, getRequestToJoinGame)
  .put(protect, acceptRequestToJoinGame)
  .delete(protect, denyRequestToJoinGame)

router.route('/:id/users').get(protect, getUsers)

router
  .route('/:gameId/users/:userId')
  .get(protect, getUser)
  .delete(protect, deleteUser)

module.exports = router
