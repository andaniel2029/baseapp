const express = require('express')
const {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  groupPhotoUpload,
  requestToJoinGroup,
  getRequestsToJoinGroup,
  getRequestToJoinGroup,
  acceptRequestToJoinGroup,
  denyRequestToJoinGroup,
  getUsers,
  getUser,
  deleteUser,
} = require('../controllers/groupsController')

const Group = require('../models/groupModel')
const advancedResults = require('../middleware/advancedResults')
const { protect, authorize } = require('../middleware/auth')
//other resource routers
const gameRouter = require('./gameRoutes')

const router = express.Router()

// Reroute
router.use('/:groupId/games', gameRouter)

router.route('/:id/photo').put(protect, groupPhotoUpload)

router
  .route('/')
  .get(advancedResults(Group, 'games'), getGroups)
  .post(protect, createGroup)

router
  .route('/:id')
  .get(getGroup)
  .put(protect, updateGroup)
  .delete(protect, deleteGroup)

router
  .route('/:id/request')
  .post(protect, requestToJoinGroup)
  .get(protect, getRequestsToJoinGroup)

router
  .route('/:groupId/request/:requestId')
  .get(protect, getRequestToJoinGroup)
  .put(protect, acceptRequestToJoinGroup)
  .delete(protect, denyRequestToJoinGroup)

router.route('/:id/users').get(protect, getUsers)

router
  .route('/:groupId/users/:userId')
  .get(protect, getUser)
  .delete(protect, deleteUser)

module.exports = router
