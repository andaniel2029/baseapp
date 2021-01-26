const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const path = require('path')

const Group = require('../models/groupModel')
const User = require('../models/userModel')

//Groups

exports.getGroups = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

exports.getGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)

  if (!group) {
    return next(
      new ErrorResponse(`Group not found with id of ${req.params.id}`, 404)
    )
  }

  res.status(200).json({ success: true, data: group })
})

exports.createGroup = asyncHandler(async (req, res, next) => {
  req.body.users = [{ user: req.user.id, role: 'creator' }]

  const group = await Group.create(req.body)
  const user = await User.findById(req.user.id)
  await user.groups.push({ group: group.id, role: 'creator' })

  await user.save()
  res.status(201).json({
    success: true,
    data: group,
  })
})

exports.updateGroup = asyncHandler(async (req, res, next) => {
  let group = await Group.findById(req.params.id)
  if (!group) {
    new ErrorResponse(`Group not found with id of ${req.params.id}`, 404)
  }
  console.log(group)
  const reqUser = await group.users.find(
    (groupUser) => groupUser.user == req.user.id
  )
  if (!reqUser) {
    return next(
      new ErrorResponse(`User making the request is not part of the group`, 401)
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

  console.log(`group: ${group}`)
  console.log(`param: ${req.params.id}`)
  group = await Group.findOneAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({ success: true, data: group })
})

exports.deleteGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)
  if (!group) {
    return next(
      new ErrorResponse(`Group not found with id of ${req.params.id}`, 404)
    )
  }

  const reqUser = await group.users.find(
    (groupUser) => groupUser.user == req.user.id
  )
  if (!reqUser) {
    return next(
      new ErrorResponse(`User making the request is not part of the group`, 404)
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

  const users = []
  group.users.map((groupUser) => users.push(groupUser.user))
  const games = []
  group.groupGames.map((groupGame) => games.push(groupGame.game))

  for (var i = 0; i < users.length; i++) {
    await User.findOne({
      _id: users[i],
    })
      .then((user) => {
        for (var j = 0; j < games.length; j++) {
          const curGame = user.games.find(
            (thisGame) => thisGame.game == games[j]
          )
          user.games.splice(user.games.indexOf(curGame), 1)
        }
        const curGroup = user.groups.find(
          (thisGroup) => thisGroup.group == req.params.id
        )
        user.groups.splice(user.groups.indexOf(curGroup), 1)
        user.save()
      })
      .catch((e) => {
        // error
      })
  }

  group.remove()

  res.status(200).json({ success: true, data: {} })
})

exports.groupPhotoUpload = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)
  const reqUser = await group.users.find(
    (groupUser) => groupUser.user == req.user.id
  )
  if (!reqUser) {
    return next(
      new ErrorResponse(`User making the request is not part of the group`, 404)
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

  if (!group) {
    return next(
      new ErrorResponse(`Group not found with id of ${req.params.id}`, 404)
    )
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400))
  }

  const file = req.files.file

  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400))
  }

  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    )
  }

  file.name = `photo_${group._id}${path.parse(file.name).ext}`

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err)
      return next(new ErrorResponse(`Problem with file upload`, 500))
    }

    await Group.findByIdAndUpdate(req.params.id, { photo: file.name })

    res.status(200).json({
      success: true,
      data: file.name,
    })
  })

  console.log(file.name)
})

//Users

exports.getUsers = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)

  if (!group) {
    return next(new ErrorResponse(`Group not found`, 404))
  }
  const groupUsers = group.users
  return res.status(200).json({
    success: true,
    count: groupUsers.length,
    data: groupUsers,
  })
})

exports.getUser = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.groupId)

  if (!group) {
    return next(new ErrorResponse(`Group not found`, 404))
  }
  const user = group.users.find(
    (groupUser) => groupUser.id === req.params.userId
  )
  if (!user) {
    return next(new ErrorResponse(`User not found`, 404))
  }

  return res.status(200).json({
    success: true,
    data: user,
  })
})

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.groupId)
  const user = await User.findById(req.params.userId)
  if (!group) {
    res.status(404)
    new ErrorResponse('Group not found', 404)
  }
  //Find user being deleted
  const deleteUser = await group.users.find(
    (groupUser) => groupUser.user == req.params.userId
  )
  if (!deleteUser) {
    res.status(404)
    new ErrorResponse('User not found', 404)
  }

  //Find user making the delete request
  const reqUser = await group.users.find(
    (groupUser) => groupUser.user == req.user.id
  )
  if (!reqUser) {
    return next(new ErrorResponse(`User is not part of the group`, 404))
  }
  if (!(reqUser.role === 'creator' || reqUser.role === 'moderator')) {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to accept a request',
        401
      )
    )
  }

  //Find groups of the user being deleted
  const userGroup = await user.groups.find(
    (userGroups) => userGroups.group == req.params.groupId
  )

  for (var i = 0; i < games.length; i++) {
    const curGame = user.games.find((thisGame) => thisGame.game == games[i])
    user.games.splice(user.games.indexOf(curGame), 1)
  }
  group.users.splice(group.users.indexOf(deleteUser), 1)
  user.groups.splice(user.groups.indexOf(userGroup.group), 1)
  await group.save()
  await user.save()
  return res.status(200).json({
    success: true,
    data: group.users,
  })
})

//Requests
exports.requestToJoinGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)

  if (!group) {
    return next(new ErrorResponse(`Group not found`, 404))
  }

  const requestExists = await group.requests.find(
    (groupRequest) => groupRequest.user == req.user.id
  )
  if (requestExists) {
    return next(new ErrorResponse(`User already made request`, 401))
  }

  await group.requests.push({
    user: req.user.id,
    message: req.body.message,
  })
  await group.save()

  res.status(201).json({ user: req.user.id, message: req.body.message })
})

exports.getRequestsToJoinGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)

  if (!group) {
    return next(new ErrorResponse(`Group not found`, 404))
  }

  const user = await group.users.find(
    (groupUser) => groupUser.user == req.user.id
  )
  if (!user) {
    return next(new ErrorResponse(`User is not part of the group`, 404))
  }
  if (user.role === 'creator' || user.role === 'moderator') {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to get requests',
        404
      )
    )
  }
  const requests = group.requests
  return res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  })
})

exports.getRequestToJoinGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.groupId)

  if (!group) {
    return next(new ErrorResponse(`Group not found`, 404))
  }
  const user = await group.users.find(
    (groupUser) => groupUser.user == req.user.id
  )
  if (!user) {
    return next(new ErrorResponse(`User is not part of the group`, 404))
  }
  if (user.role === 'creator' || user.role === 'moderator') {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to get a request',
        404
      )
    )
  }
  const request = group.requests.find(
    (groupRequest) => groupRequest.id === req.params.requestId
  )

  return res.status(200).json({
    success: true,
    data: request,
  })
})

exports.acceptRequestToJoinGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.groupId)

  if (!group) {
    return next(new ErrorResponse(`Group not found`, 404))
  }
  const user = await group.users.find(
    (groupUser) => groupUser.user == req.user.id
  )
  if (!user) {
    return next(new ErrorResponse(`User is not part of the group`, 404))
  }
  if (user.role === 'creator' || user.role === 'moderator') {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to accept a request',
        404
      )
    )
  }

  const request = group.requests.find(
    (groupRequest) => groupRequest.id === req.params.requestId
  )
  if (!request) {
    return next(new ErrorResponse(`Request not found`, 404))
  }

  User.findOne({
    _id: request.user,
  })
    .then((user) => {
      console.log(user)
      user.groups.push({
        group: req.params.groupId,
      })
      user.save()
    })
    .catch((e) => {
      // error
    })

  await group.users.push({
    user: request.user,
  })
  group.requests.splice(group.requests.indexOf(request), 1)

  const groupUsers = await User.findById(request.user)
  await groupUsers.groups.push({ group: group.id })
  await group.save()

  return res.status(200).json({
    success: true,
    data: group.users,
  })
})

exports.denyRequestToJoinGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.groupId)

  if (!group) {
    return next(new ErrorResponse(`Group not found`, 404))
  }
  const user = await group.users.find(
    (groupUser) => groupUser.user == req.user.id
  )
  if (!user) {
    return next(new ErrorResponse(`User is not part of the group`, 404))
  }
  if (user.role === 'creator' || user.role === 'moderator') {
    return next(
      new ErrorResponse(
        'User must be a creator or moderator to accept a request',
        404
      )
    )
  }
  const request = group.requests.find(
    (groupRequest) => groupRequest.id === req.params.requestId
  )
  if (!request) {
    return next(new ErrorResponse(`Request not found`, 404))
  }
  group.requests.splice(group.requests.indexOf(request), 1)
  await group.save()
  return res.status(200).json({
    success: true,
    data: group.requests,
  })
})
