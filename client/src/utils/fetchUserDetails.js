import Axios from "./Axios"
import SummaryApi from "../common/SummaryApi"

const fetchUserDetails = async()=>{
    try {
        // User details endpoint works for all user types (USER, ADMIN, DELIVERY_AGENT)
        const response = await Axios({
            ...SummaryApi.userDetails
        })
        return response.data
    } catch (error) {
        // 401 is expected if user is not logged in - don't log as error
        if (error.response?.status !== 401) {
            console.log('Error fetching user details:', error.message)
        }
        // Return null on error to prevent undefined access
        return null
    }
}

export default fetchUserDetails
