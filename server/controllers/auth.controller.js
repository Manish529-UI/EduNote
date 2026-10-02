import UserModel from "../models/user.model.js"
import { getToken } from "../utils/token.js"

const isProduction = process.env.NODE_ENV === "production"

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
}

export const googleAuth = async (req,res) => {
    try {
        
        const {name , email} = req.body
        let user = await UserModel.findOne({email})
        if(!user){
            user = await UserModel.create({
                name , email
            })
        }
        let token = await getToken(user._id)
        res.cookie("token" , token , cookieOptions)
        return res.status(200).json({ user, token })
    } catch (error) {
        return res.status(500).json({message:`googleSignup Error  ${error}`})
    }
    
}

export const logOut = async (req,res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
        })
         return res.status(200).json({message:"LogOut Successfully"})
    } catch (error) {
        return res.status(500).json({message:`Logout Error  ${error}`})
    }
}