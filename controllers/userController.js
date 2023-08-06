const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");

require('dotenv').config()

const randormstring = require("randomstring");

const securePassword = async(password)=>{

    try {
        
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;

    } catch (error) {
        console.log(error.message);
    }

}

//for send mail
const sendVerifyMail = async(name, email, user_id)=>{

    try {
        
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:true,
            requireTLS:true,
            auth:{
                user:"rahulbhingardeve744@gmail.com",
                pass:"orflgrnibhaxxyyj"
            },
            service:"gmail",
        });
        const mailOptions = {
            from:"rahulbhingardeve744@gmail.com",
            to:email,
            subject:'For Verification mail',
            html:'<p>Hii '+name+', please click here to <a href="https://usermanamentsystem-1.onrender.com/verify?id='+user_id+'"> Verify </a> your mail.</p>'
        }
        transporter.sendMail(mailOptions, function(error,info){
            if(error){
                console.log(error);
            }
            else{
                console.log("Email has been sent:- ",info.response);
            }
        })

    } catch (error) {
        console.log(error.message);
    }

}

//for reset password send mail
const sendResetPasswordMail = async(name, email, token)=>{

    try {
        
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            pport:587,
            secure:true,
            requireTLS:true,
            auth:{
                user:"rahulbhingardeve744@gmail.com",
                pass:"orflgrnibhaxxyyj"
            },
            service:"gmail",
        });
        const mailOptions = {
            from:"rahulbhingardeve744@gmail.com",
            to:email,
            subject:'For Reset Password',
            html:'<p>Hii '+name+', please click here to <a href="https://usermanamentsystem-1.onrender.com/forget-password?token='+token+'"> Reset </a> your password.</p>'
        }
        transporter.sendMail(mailOptions, function(error,info){
            if(error){
                console.log(error);
            }
            else{
                console.log("Email has been sent:- ",info.response);
            }
        })

    } catch (error) {
        console.log(error.message);
    }

}

const loadRegister = async(req,res)=>{
    try {
        
        res.render('registration');

    } catch (error) {
        console.log(error.message);
    }
}

const insertUser = async(req,res)=>{

    try {
        const spassword = await securePassword(req.body.password);
        const user = new User({
           name:req.body.name,
           email:req.body.email,
           mobile:req.body.mobile,
           image:req.file.filename,
           password:spassword,
           is_admin:0
        });

        const userData = await user.save();

        if(userData){
            sendVerifyMail(req.body.name, req.body.email, userData._id);
           res.render('registration',{message:"Your registration has been successfully, Please verify your mail."});
        }
        else{
           res.render('registration',{message:"Your registration has been failed."});
        }

    } catch (error) {
        console.log(error.message);
    }

}

const verifyMail = async(req, res)=>{

    try {
        
        const updateInfo = await User.updateOne({_id:req.query.id},{ $set:{ is_varified:1 } });

        console.log(updateInfo);
        res.render("email-verified");

    } catch (error) {
        console.log(error.message);
    }

}

// login user methods started

const loginLoad = async(req,res)=>{

    try {
        
        res.render('login');

    } catch (error) {
        console.log(error.message);
    }

}

const verifyLogin = async(req,res)=>{

    try {
        
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email});

        if(userData){
           
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if(passwordMatch){
                if(userData.is_varified === 0){
                   res.render('login',{message:"Please verify your mail."});
                }
                else{
                    req.session.user_id = userData._id;
                   res.redirect('/home');
                }
            }
            else{
                res.render('login',{message:"Email and password is incorrect"});
            }
        }
        else{
          res.render('login',{message:"Email and password is incorrect"});
        }

    } catch (error) {
        console.log(error.message);
    }

}

const loadHome = async(req,res)=>{
    try {
        
        const userData = await User.findById({ _id:req.session.user_id });
        res.render('home',{ user:userData });

    } catch (error) {
        console.log(error.message);
    }
}

const userLogout = async(req,res)=>{

    try {
        
        req.session.destroy();
        res.redirect('/');

    } catch (error) {
        console.log(error.message);
    }

}

// forget password code start

const forgetLoad = async(req,res)=>{
    try {
        
        res.render('forget');

    } catch (error) {
        console.log(error.message);
    }
}

const forgetVerify = async(req,res)=>{

    try {
        
        const email = req.body.email;
        const userData = await User.findOne({email:email});
        if(userData){
            if(userData.is_varified === 0){
                res.render('forget',{message:"Please verify your mail."});
            }
            else{
                const randomString = randormstring.generate();
                const updatedData = await User.updateOne({email:email},{$set:{ token:randomString }});
                sendResetPasswordMail(userData.name,userData.email,randomString);
                res.render('forget',{message:"Please check your mail to reset your password."});
            }
        }
        else{
            res.render('forget',{message:"User email is incorrect."});
        }

    } catch (error) {
        console.log(error.message);
    }

}

const forgetPasswordLoad = async(req,res)=>{

    try {
        
        const token = req.query.token;
        const tokenData = await User.findOne({token:token});
        if(tokenData){
            res.render('forget-password',{user_id:tokenData._id});
        }
        else{
            res.render('404',{message:"Token is invalid."});
        }

    } catch (error) {
        console.log(error.message);
    }

}

const resetPassword = async(req,res)=>{
    try {
        
        const password = req.body.password;
        const user_id = req.body.user_id;

        const secure_password = await securePassword(password);
        
        const udupatedData = await User.findByIdAndUpdate({ _id:user_id },{ $set:{ password:secure_password, token:'' } });

        res.redirect("/");

    } catch (error) {
        console.log(error.message);
    }
}

//for verification send mail link

const verificationLoad = async(req,res)=>{

    try {
        
        res.render('verification');

    } catch (error) {
        console.log(error.message);
    }

}
const about = async(req,res)=>{

    try {
        
        res.render('about');

    } catch (error) {
        console.log(error.message);
    }

}
const contact = async(req,res)=>{

    try {
        
        res.render('contact');

    } catch (error) {
        console.log(error.message);
    }

}

const sentVerificationLink = async(req,res)=>{

    try {
        
        const email = req.body.email;
        const userData = await User.findOne({ email:email });
        if(userData){

            sendVerifyMail(userData.name, userData.email, userData._id);

            res.render('verification',{ message:"Reset verification mail sent your mail id, please check." });

        }
        else{
            res.render('verification',{message:"This email is not exist."});
        }

    } catch (error) {
        console.log(error.message);
    }

}

//user profile edit & update

const editLoad = async(req,res)=>{

    try {
        
       const id = req.query.id;

       const userData = await User.findById({ _id:id });

       if(userData){
           res.render('edit',{ user:userData });
       }
       else{
           res.redirect('/home');
       }

    } catch (error) {
        console.log(error.message);
    }

}

const updateProfile = async(req,res)=>{

    try {
        
        if(req.file){
            const userData = await User.findByIdAndUpdate({ _id:req.body.user_id },{ $set:{name:req.body.name, email:req.body.email, mobile:req.body.mobile, image:req.file.filename} });
        }
        else{
           const userData = await User.findByIdAndUpdate({ _id:req.body.user_id },{ $set:{name:req.body.name, email:req.body.email, mobile:req.body.mobile} });
        }

        res.redirect('/home');

    } catch (error) {
        console.log(error.message);
    }

}

//delete
const deleteUser = async (req, res) => {
    try {
      const id = req.query.id;
      const a=await User.deleteOne({ _id: id });
      res.redirect("/home");
    } catch (error) {
      console.log(error.message);
    }
  };


module.exports = {
    loadRegister,
    insertUser,
    contact,
    about,
    verifyMail,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    verificationLoad,
    sentVerificationLink,
    editLoad,
    updateProfile,
    deleteUser
}
