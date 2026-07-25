import toast from "react-hot-toast"

const AxiosToastError = (error)=>{
    const errorMessage = error?.response?.data?.message
    const statusCode = error?.response?.status
    
    // Handle authentication errors with user-friendly messages
    if (statusCode === 401 || errorMessage === "Provide token" || errorMessage === "Token expired" || errorMessage === "Invalid token") {
        toast.error("Please login to continue")
        return
    }
    
    // Show the actual error message for other errors
    toast.error(errorMessage || "Something went wrong")
}

export default AxiosToastError