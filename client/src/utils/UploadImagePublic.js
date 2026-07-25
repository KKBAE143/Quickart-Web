import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'

/**
 * Upload image without authentication
 * Used for rider registration document uploads (before user is logged in)
 */
const uploadImagePublic = async(image)=>{
    try {
        const formData = new FormData()
        formData.append('image',image)

        const response = await Axios({
            ...SummaryApi.uploadImagePublic,
            data : formData
        })

        console.log('Upload response:', response.data)
        return response
    } catch (error) {
        console.error('Upload error:', error)
        throw error
    }
}

export default uploadImagePublic
