import React, { useState, useEffect } from 'react';//imrse
import { signInWithPopup , GoogleAuthProvider} from 'firebase/auth';
import axios  from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth } from '../fire';
import './Login.css';
import { FcGoogle } from "react-icons/fc";


const Login = () => {
const navigate = useNavigate();

const handleLoging = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // לבדוק אם המשתמש קיים ב-PHP
        const data = new FormData();
        data.append("userId", user.uid);
        const url = "http://localhost:8080/www/tripmasterv01/public/checkuserExist.php";
        const response = await axios.post(url, data);
        
        if (response.data === "Exist") {
            console.log(response.data);
            navigate('/Home');
        } else {
            navigate('/Profile');
        }

    } catch (error) {
        console.error("Login failed:", error);
    }
};

    return ( 
        <div className='page-w'>
            <div className="login-container">
                <h1 className='Login-header'>Login</h1>

                Sign in with  :
                <FcGoogle onClick={handleLoging}  className='login-GoogleLogo'/> 
                
            </div>
        </div>

     );
}
 
export default Login;
