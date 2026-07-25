import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    wishlist : [],
    loading: false,
    error: null
}

const wishlistSlice = createSlice({
    name : 'wishlist',
    initialState : initialState,
    reducers : {
        setWishlist : (state, action) => {
            state.wishlist = action.payload
        },
        addToWishlist : (state, action) => {
            // Add item if not already in wishlist
            const exists = state.wishlist.find(item => 
                item.productId?._id === action.payload.productId?._id
            )
            if (!exists) {
                state.wishlist.push(action.payload)
            }
        },
        removeFromWishlist : (state, action) => {
            // Remove item by productId
            state.wishlist = state.wishlist.filter(item => 
                item.productId?._id !== action.payload
            )
        },
        clearWishlist : (state) => {
            state.wishlist = []
        },
        setWishlistLoading : (state, action) => {
            state.loading = action.payload
        },
        setWishlistError : (state, action) => {
            state.error = action.payload
        }
    }
})

export const { 
    setWishlist, 
    addToWishlist, 
    removeFromWishlist, 
    clearWishlist,
    setWishlistLoading,
    setWishlistError
} = wishlistSlice.actions

export default wishlistSlice.reducer

