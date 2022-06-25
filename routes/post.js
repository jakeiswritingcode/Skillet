const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const requireLogin  = require('../middleware/requireLogin')
const Post =  mongoose.model("Post")


router.post('/createpost',requireLogin,(req,res)=>{
    const {title,pic,cooktime,ingredients,directions} = req.body
    if(!title || !pic || !cooktime || !directions){
        return res.status(422).json({error:"please add all the fields"})
    }
    req.user.password = undefined
    const post = new Post({
        postedBy:req.user,
        photo:pic,
        title,
        cooktime,
        ingredients,
        directions
    })
    post.save().then(result=>{
        res.json({post:result})
    })
    .catch(err=>{
        console.log(err)
    })
})

router.get('/allposts',requireLogin,(req,res)=>{
    Post.find()
    .populate("postedBy","_id name pfp")
    .populate("comments.postedBy","_id name")
    .sort('-createdAt')
    .then(posts=>{
        res.json({posts})
    })
    .catch(err=>{
        console.log(err)
    })
})

router.get('/getfollowedposts',requireLogin,(req,res)=>{
    Post.find({postedBy:{$in:req.user.following}})
    .populate("postedBy","_id name pfp")
    .populate("comments.postedBy","_id name")
    .sort('-createdAt')
    .then(posts=>{
        res.json({posts})
    })
    .catch(err=>{
        console.log(err)
    })
})

router.get('/myposts',requireLogin,(req,res)=>{
    Post.find({postedBy:req.user._id})
    .populate("postedBy","_id name")
    .populate("comments.postedBy","_id name")
    .sort('-createdAt') 
    .then(myposts=>{
        res.json({myposts})
    })
    .catch(err=>{
        console.log(err)
    })
})

router.get('/getpost/:postId',(req,res)=>{
    Post.findById(req.params.postId)
    .populate("postedBy","_id name")
    .populate("comments.postedBy","_id name")
    .then(post=>{
        res.json(post)
    })
    .catch(err=>{
        console.log(err)
    })
})

router.put('/like',requireLogin,(req,res)=>{
    Post.findByIdAndUpdate(req.body.postId,
        { $push: { likes: req.user._id } },
        { new:true }
    )
    .populate("postedBy","_id name pfp")
    .populate("comments.postedBy","_id name")
    .exec((err,result)=>{
        if(err){
            return res.status(422).json({error:err})
        }
        else{
            res.json(result)
        }
    })
})

router.put('/unlike',requireLogin,(req,res)=>{
    Post.findByIdAndUpdate(req.body.postId,
        { $pull: { likes:req.user._id } },
        { new:true }
    )
    .populate("postedBy","_id name pfp")
    .populate("comments.postedBy","_id name")
    .exec((err,result)=>{
        if(err){
            return res.status(422).json({error:err})
        }
        else{
            res.json(result)
        }
    })
})

router.put('/comment',requireLogin,(req,res)=>{
    const comment = {
        text:req.body.text,
        postedBy:req.user._id
    }
    Post.findByIdAndUpdate(req.body.postId,
        { $push: { comments: comment } },
        { new:true }
    )
    .populate("postedBy","_id name pfp")
    .populate("comments.postedBy","_id name")
    .exec((err,result)=>{
        if(err){
            return res.status(422).json({error:err})
        }
        else{
            res.json(result)
        }
    })
})

router.delete('/deletecomment/:postId/:commentId', requireLogin, (req, res) => {
    Post.findByIdAndUpdate(req.params.postId,
        { $pull: { comments: { _id: { $eq: req.params.commentId } } } },
        { new:true }
    )
    .populate("comments.postedBy","_id name")
    .exec((err,result)=>{
        if(err){
            return res.status(422).json({error:err})
        }
        else{
            res.json(result)
        }
    })
})



router.delete('/deletepost/:postId',requireLogin,(req,res)=>{
    Post.findById(req.params.postId)
    .populate("postedBy","_id")
    .exec((err,post)=>{
        if(err || !post){
            return res.status(422).json({error:err})
        }
        if(post.postedBy._id.toString() === req.user._id.toString()){
            post.remove()
            .then(result=>{
                res.json(result)
            })
            .catch(err=>{
                console.log(err)
            })
        }
    })
})



module.exports = router