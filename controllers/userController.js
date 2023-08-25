const User = require('../models/User');
const Post = require('../models/Posts');
const { success, error } = require('../utils/responseWrapper');
const { mapPostOutput } = require('../utils/Utils');
const cloudinary = require('cloudinary').v2;

const followOrUnfollowUserController = async (req, res) => {
  try {
    const { userIdToFollow } = req.body;
    const currUserId = req._id;

    const userToFollow = await User.findById(userIdToFollow);
    const currUser = await User.findById(currUserId);

    if (currUserId === userIdToFollow) {
      return res.send(error(409, 'Users cannot follow themselves'));
    }

    if (!userToFollow) {
      return res.send(error(404, 'User to follow not found'));
    }

    if (currUser.followings.includes(userIdToFollow)) {
      //already followed
      const followingIndex = currUser.followings.indexOf(userIdToFollow);
      currUser.followings.splice(followingIndex, 1);

      const followerIndex = userToFollow.followers.indexOf(currUser);
      userToFollow.followers.splice(followerIndex, 1);
    } else {
      userToFollow.followers.push(currUserId);
      currUser.followings.push(userIdToFollow);
    }

    await userToFollow.save();
    await currUser.save();

    return res.send(success(200, { user: userToFollow }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const getPostOfFollowing = async (req, res) => {
  try {
    const currUserId = req._id;
    const currUser = await User.findById(currUserId).populate('followings');

    const fullPosts = await Post.find({
      owner: {
        $in: currUser.followings,
      },
    }).populate('owner');

    const posts = fullPosts
      .map((item) => mapPostOutput(item, req._id))
      .reverse();

    const followingsIds = currUser.followings.map((item) => item._id);
    followingsIds.push(req._id);

    const suggestions = await User.find({
      _id: {
        $nin: followingsIds,
      },
    });

    return res.send(success(200, { ...currUser._doc, suggestions, posts }));
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};

const getMyPosts = async (req, res) => {
  try {
    const currUserId = req._id;

    const allUserPosts = await Post.find({ owner: currUserId }).populate(
      'likes'
    );

    return res.send(success(200, allUserPosts));
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};

const getUserPosts = async (req, res) => {
  try {
    const userId = req.body.userId;

    if (!userId) {
      return res.send(error(400, 'UserId is required'));
    }

    const allUserPosts = await Post.find({ owner: userId }).populate('likes');

    return res.send(success(200, allUserPosts));
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};

const deleteMyProfile = async (req, res) => {
  try {
    const currUserId = req._id;
    const currUser = await User.findById(currUserId);

    //delete all posts
    await Post.deleteMany({ owner: currUserId });

    // removing user from followers that are following

    for (const followerId of currUser.followers) {
      const follower = await User.findById(followerId);
      const index = follower.followings.indexOf(currUserId);
      follower.followings.splice(index, 1);
      await follower.save();
    }

    // removing user from following other
    for (const followingsId of currUser.followings) {
      const following = await User.findById(followingsId);
      const index = following.followers.indexOf(currUserId);
      following.followers.splice(index, 1);
      await following.save();
    }

    // remove user from all likes
    const allPosts = await Post.find();
    for (const post of allPosts) {
      const index = post.likes.indexOf(currUserId);
      post.likes.splice(index, 1);
      await post.save();
    }

    await currUser.deleteOne();

    res.clearCookie('jwt', {
      httpOnly: true,
      secure: true,
    });

    return res.send(success(200, 'User deleted'));
  } catch (e) {
    console.log(e);
    return res.send(error(500, e.message));
  }
};

const getMyInfo = async (req, res) => {
  try {
    const user = await User.findById(req._id);
    return res.send(success(200, { user }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, bio, userImg } = req.body;

    const user = await User.findById(req._id);

    if (name) {
      user.name = name;
    }

    if (bio) {
      user.bio = bio;
    }
    if (userImg) {
      const cloudImg = await cloudinary.uploader.upload(userImg, {
        folder: 'userProfileImages',
      });
      user.avatar = {
        url: cloudImg.secure_url,
        publicId: cloudImg.public_id,
      };
    }

    await user.save();
    return res.send(success(200, { user }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.body.userId;

    const user = await User.findById(userId).populate({
      path: 'posts',
      populate: {
        path: 'owner',
      },
    });
    const fullPosts = user.posts;
    const posts = fullPosts
      .map((item) => mapPostOutput(item, req._id))
      .reverse();

    return res.send(success(200, { ...user._doc, posts }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

module.exports = {
  followOrUnfollowUserController,
  getPostOfFollowing,
  getMyPosts,
  getUserPosts,
  deleteMyProfile,
  getMyInfo,
  updateUserProfile,
  getUserProfile,
};
