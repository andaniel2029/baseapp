const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')

const Game = require('../models/gameModel')
const User = require('../models/userModel')
const Group = require('../models/groupModel')

// Games

exports.getGames = asyncHandler(async (req, res, next) => {
  if (req.params.groupId) {
    const games = await Game.find({ group: req.params.groupId })
    return res.status(200).json({
      success: true,
      count: games.length,
      data: games,
    })
  } else {
    res.status(200).json(res.advancedResults)
  }
})

exports.getGame = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.id).populate({
    path: 'group',
    select: 'name description',
  })

  if (!game) {
    return next(
      new ErrorResponse(`No game with the id of ${req.params.id}`, 404)
    )
  }

  res.status(200).json({
    success: true,
    data: game,
  })
})

exports.addGame = asyncHandler(async (req, res, next) => {
  req.body.group = req.params.groupId
  req.body.users = [{ user: req.user.id, role: 'creator' }]

  const group = await Group.findById(req.params.groupId)
  const user = await User.findById(req.user.id)

  if (!group) {
    return next(
      new ErrorResponse(`No group with the id of ${req.params.groupId}`, 404)
    )
  }

  const game = await Game.create(req.body)

  await group.groupGames.push({ game: game.id, role: 'creator' })
  await group.save()

  await user.games.push({ game: game.id, role: 'creator' })
  await user.save()

  res.status(200).json({
    success: true,
    data: game,
  })
})

exports.updateGame = asyncHandler(async (req, res, next) => {
  let game = await Game.findById(req.params.id)
  if (!game) {
    return next(
      new ErrorResponse(`No game with the id of ${req.params.id}`, 404)
    )
  }

  const reqUser = await game.users.find(
    (gameUser) => gameUser.user == req.user.id
  )
  if (!reqUser) {
    return next(
      new ErrorResponse(`User making the request is not part of the game`, 404)
    )
  }
  if (!(reqUser.role === 'creator' || reqUser.role === 'moderator')) {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to accept a request',
        401
      )
    )
  }

  game = await Game.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: game,
  })
})

exports.deleteGame = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.id)
  if (!game) {
    return next(
      new ErrorResponse(`No game with the id of ${req.params.id}`, 404)
    )
  }

  const reqUser = await game.users.find(
    (gameUser) => gameUser.user == req.user.id
  )
  if (!reqUser) {
    return next(
      new ErrorResponse(`User making the request is not part of the game`, 404)
    )
  }
  if (!(reqUser.role === 'creator' || reqUser.role === 'moderator')) {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to accept a request',
        401
      )
    )
  }

  //Remove game from group
  const group = await Group.findById(game.group)
  const groupGame = await group.groupGames.find(
    (thisGame) => thisGame.game == req.params.id
  )
  group.groupGames.splice(group.groupGames.indexOf(groupGame), 1)
  group.save()

  //Remove game from users
  const users = []
  game.users.map((gameUser) => users.push(gameUser.user))

  for (var i = 0; i < users.length; i++) {
    await User.findOne({
      _id: users[i],
    })
      .then((user) => {
        const curGame = user.games.find(
          (thisGame) => thisGame.game == req.params.id
        )
        user.games.splice(user.games.indexOf(curGame), 1)
        user.save()
      })
      .catch((e) => {
        // error
      })
  }

  await game.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// Users
exports.getUsers = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.id)

  //Error checking
  if (!game) {
    return next(
      new ErrorResponse(`No game with the id of ${req.params.id}`, 404)
    )
  }

  const gameUsers = game.users
  return res.status(200).json({
    success: true,
    count: gameUsers.length,
    data: gameUsers,
  })
})

exports.getUser = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.gameId)

  //Error checking
  if (!game) {
    return next(
      new ErrorResponse(`No game with the id of ${req.params.id}`, 404)
    )
  }

  const user = game.users.find((gameUser) => gameUser.id === req.params.userId)
  if (!user) {
    return next(new ErrorResponse(`User is not part of the game`, 404))
  }

  return res.status(200).json({
    success: true,
    data: user,
  })
})

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.gameId)

  //Error checking
  if (!game) {
    return next(
      new ErrorResponse(`No game with the id of ${req.params.id}`, 404)
    )
  }

  const gameUser = game.users.find(
    (gameUser) => gameUser.user == req.params.userId
  )
  if (!gameUser) {
    return next(new ErrorResponse(`User is not part of the game`, 404))
  }

  const reqUser = await game.users.find(
    (gameUser) => gameUser.user == req.user.id
  )
  if (!reqUser) {
    return next(
      new ErrorResponse(`User making the request is not part of the game`, 404)
    )
  }
  if (!(reqUser.role === 'creator' || reqUser.role === 'moderator')) {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to accept a request',
        401
      )
    )
  }

  const user = await User.findOne({ _id: req.params.userId })
  const curGame = user.games.find(
    (thisGame) => thisGame.game == req.params.gameId
  )
  user.games.splice(user.games.indexOf(curGame), 1)
  user.save()

  game.users.splice(game.users.indexOf(gameUser), 1)
  await game.save()
  return res.status(200).json({
    success: true,
    data: game.users,
  })
})

// Requests

exports.requestToJoinGame = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.id)

  if (game) {
    await game.requests.push({
      user: req.user.id,
      message: req.body.message,
    })
    await game.save()

    res.status(201).json({ user: req.user.id, message: req.body.message })
  } else {
    return next(new ErrorResponse(`Game not found`, 404))
  }
})

exports.getRequestsToJoinGame = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.gameId)
  if (!game) {
    return next(
      new ErrorResponse(`No game with the id of ${req.params.gameId}`, 404)
    )
  }

  const reqUser = await game.users.find(
    (gameUser) => gameUser.user == req.user.id
  )
  if (!reqUser) {
    return next(
      new ErrorResponse(`User making the request is not part of the game`, 404)
    )
  }
  if (!(reqUser.role === 'creator' || reqUser.role === 'moderator')) {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to accept a request',
        401
      )
    )
  }

  const requests = game.requests
  return res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  })
})

exports.getRequestToJoinGame = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.gameId)
  if (!game) {
    return next(
      new ErrorResponse(`No game with the id of ${req.params.gameId}`, 404)
    )
  }

  const reqUser = await game.users.find(
    (gameUser) => gameUser.user == req.user.id
  )
  if (!reqUser) {
    return next(
      new ErrorResponse(`User making the request is not part of the game`, 404)
    )
  }
  if (!(reqUser.role === 'creator' || reqUser.role === 'moderator')) {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to accept a request',
        401
      )
    )
  }

  const request = game.requests.find(
    (gameRequest) => gameRequest.id === req.params.requestId
  )
  if (!request) {
    return next(new ErrorResponse(`Request not found`, 404))
  } else {
    return res.status(200).json({
      success: true,
      data: request,
    })
  }
})

exports.acceptRequestToJoinGame = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.gameId)
  if (!game) {
    return next(
      new ErrorResponse(`No game with the id of ${req.params.gameId}`, 404)
    )
  }

  const reqUser = await game.users.find(
    (gameUser) => gameUser.user == req.user.id
  )
  if (!reqUser) {
    return next(
      new ErrorResponse(`User making the request is not part of the game`, 404)
    )
  }
  if (!(reqUser.role === 'creator' || reqUser.role === 'moderator')) {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to accept a request',
        401
      )
    )
  }
  const request = game.requests.find(
    (gameRequest) => gameRequest.id === req.params.requestId
  )
  if (!request) {
    return next(new ErrorResponse(`Request not found`, 404))
  } else {
    await game.users.push({
      user: request.user,
    })
    game.requests.splice(game.requests.indexOf(request), 1)
    User.findOne({
      _id: request.user,
    })
      .then((user) => {
        console.log(user)
        user.games.push({
          game: req.params.gameId,
        })
        user.save()
      })
      .catch((e) => {
        // error
      })
    await game.save()
    return res.status(200).json({
      success: true,
      data: game.users,
    })
  }
})

exports.denyRequestToJoinGame = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.gameId)
  if (!game) {
    return next(
      new ErrorResponse(`No game with the id of ${req.params.gameId}`, 404)
    )
  }

  const reqUser = await game.users.find(
    (gameUser) => gameUser.user == req.user.id
  )
  if (!reqUser) {
    return next(
      new ErrorResponse(`User making the request is not part of the game`, 404)
    )
  }
  if (!(reqUser.role === 'creator' || reqUser.role === 'moderator')) {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to accept a request',
        401
      )
    )
  }
  const request = game.requests.find(
    (gameRequest) => gameRequest.id === req.params.requestId
  )
  if (!request) {
    return next(new ErrorResponse(`Request not found`, 404))
  } else {
    game.requests.splice(game.requests.indexOf(request), 1)
    await game.save()
    return res.status(200).json({
      success: true,
      data: game.requests,
    })
  }
})
