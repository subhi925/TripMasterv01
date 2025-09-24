import React from 'react';
import {useAuthState} from "react-firebase-hooks/auth";
import { Navigate, useLocation} from 'react-router-dom';
import { auth } from '../fire';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const PrivetRoute = ({element : Component}) => {
    const [user, loading] = useAuthState(auth);
    const location = useLocation();

    if(loading){
        return (
            <div>
                 <DotLottieReact src="https://lottie.host/434cf64c-00ed-4c3d-9489-05e33b24565c/CdFG0JW6LS.lottie" loop autoplay />
            </div>
        );

    }
    if(!user){
        return <Navigate to="/login" state={{from : location}}/>
    }

    return ( 
        <Component/>
     );
}
 
export default PrivetRoute;