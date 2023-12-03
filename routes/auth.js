const express=require('express');
const router=express.Router();
const User= require('../models/User');
const {body,validationResult}=require('express-validator');
const bcrypt= require('bcryptjs');
const jwt=require('jsonwebtoken');
const JWT_SECRET="Someshisagoodboy";
const fetchuser=require('../middleware/fetchuser')
//Route1:create a user using :POST "/api/auth/createUser" no login required
router.post('/createUser',[
    body('name').isLength({min:3}),
    body('email').isEmail(),
    body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&])/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one special character')
],async (req,res)=>{
    let signup=false
    const result=validationResult(req)
    //validationResult return true or false by checking all validations are fullfil or not
    //if result is empty means there is no error
    if(!result.isEmpty()){
    return res.json({errors:result.array()})
    }
    //result.array() containes an array of all the errors 
    //checking if email already exists
    let user=await User.findOne({email:req.body.email})
    if(user){
        return res.status(400).json({msg:"Email already exists"})
    }
    // Password hashing
    const salt=await bcrypt.genSalt(10);
    const secPass=await bcrypt.hash(req.body.password,salt)
    
    // User Creation
    user=await new User({
        name:req.body.name,
        email:req.body.email,
        password:secPass
    }) 
    
    const data={
        user:{
            id:user.id
        }
    }
    user.save().then(()=>{
        const authToken =jwt.sign(data,JWT_SECRET);
        signup=true
        // console.log(authToken)
        // return res.status(200).json({msg:"User Created Successfully",password:secPass})
        res.json({authToken,signup,msg:"User Created Successfully"})
    })
})

//Route2: Authenticate a user using :POST "/api/auth/login", no login required
router.post('/loginUser',[
    body('email',"Enter a valid email").isEmail(),
    body('password','Password cannot be blank').exists()
],async (req,res)=>{
    let login=false
        //if there are errors return bad request and the errors
    const result=validationResult(req)
    if(!result.isEmpty()){
    return res.json({errors:result.array()})
    }
    const {email,password}=req.body
    try {
        let user=await User.findOne({email})
        if(!user){
            return res.status(400).json({msg:"Please try to login with correct credentials"})
        }
        const passwordCompare=await bcrypt.compare(password,user.password)
        if(!passwordCompare)
        {
            return res.status(400).json({msg:"Please try to login with correct credentials"})
        }
        login=true
        const data={
            user:{
                id:user.id
            }
        }
            const authToken =jwt.sign(data,JWT_SECRET);
            res.json({authToken,login,msg:"Successfully Login"})
        
    } catch (error) {
        console.log(error.message)
        res.status(500).send({msg:"Internal server error occured"})
    }
})

//Route3: Get logged in user details using : POST "api/auth/getUser". Login Required
router.post('/getUser', fetchuser,async (req,res)=>{
    try {
         const userId=req.user.id;
        const user= await User.findById(userId).select("-password")
        res.send(user)
    } catch (error) {
        console.error(error.message)
        res.status(500).send({msg:"Internal Server Error"})
    }
})
module.exports=router