import React, { useState, useEffect } from 'react'
import { FaClock, FaCheckCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'

/**
 * Delivery Slot Selector Component
 * Allows users to select a delivery date and time slot
 * 
 * Available Slots:
 * - 7am-8am (Morning)
 * - 10am-11am (Late Morning)
 * - 1pm-2pm (Afternoon)
 * - 4pm-5pm (Evening)
 * - 7pm-8pm (Night)
 * - 10pm-11pm (Late Night)
 */
const DeliverySlotSelector = ({ selectedSlot, onSlotChange, selectedDate, onDateChange }) => {
  const [availableDates, setAvailableDates] = useState([])

  // Define time slots
  const timeSlots = [
    { id: '7am-8am', label: '7:00 AM - 8:00 AM', icon: '🌅', tag: 'Morning' },
    { id: '10am-11am', label: '10:00 AM - 11:00 AM', icon: '☀️', tag: 'Late Morning' },
    { id: '1pm-2pm', label: '1:00 PM - 2:00 PM', icon: '🌤️', tag: 'Afternoon' },
    { id: '4pm-5pm', label: '4:00 PM - 5:00 PM', icon: '🌆', tag: 'Evening' },
    { id: '7pm-8pm', label: '7:00 PM - 8:00 PM', icon: '🌙', tag: 'Night' },
    { id: '10pm-11pm', label: '10:00 PM - 11:00 PM', icon: '🌃', tag: 'Late Night' }
  ]

  // Generate available dates (today + next 7 days)
  useEffect(() => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        display: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        })
      })
    }
    
    setAvailableDates(dates)
    
    // Auto-select today if no date selected
    if (!selectedDate && dates.length > 0) {
      onDateChange(dates[0].date)
    }
  }, [])

  const handleSlotClick = (slotId) => {
    if (!selectedDate) {
      toast.error('Please select a delivery date first')
      return
    }
    onSlotChange(slotId)
    toast.success(`Delivery slot selected: ${slotId}`, { duration: 2000 })
  }

  const handleDateChange = (date) => {
    onDateChange(date)
    // Clear slot selection when date changes
    if (selectedSlot) {
      toast('Please reselect your delivery time slot', { icon: '🕐' })
    }
  }

  // Check if slot is available
  const isSlotAvailable = (slotId) => {
    if (!selectedDate) return false
    
    const today = new Date()
    const currentDate = today.toISOString().split('T')[0]
    
    // If selected date is future, all slots are available
    if (selectedDate > currentDate) return true
    
    // If selected date is past (shouldn't happen with current logic but for safety), unavailable
    if (selectedDate < currentDate) return false
    
    // Logic for Today
    const currentHour = today.getHours()
    let startHour = 0
    
    // Parse start hour from slotId (e.g., '7am-8am', '1pm-2pm', '10am-11am')
    const timePart = slotId.split('-')[0] // '7am', '10am', '1pm'
    const isPM = timePart.toLowerCase().includes('pm')
    const hourNum = parseInt(timePart.replace(/am|pm/i, ''))
    
    if (isPM && hourNum !== 12) {
      startHour = hourNum + 12
    } else if (!isPM && hourNum === 12) {
      startHour = 0
    } else {
      startHour = hourNum
    }

    // Allow booking if current hour is strict less than start hour
    // e.g. at 7:00 or 7:30, cannot book 7-8 slot. Must book before 7.
    return currentHour < startHour
  }

  return (
    <div className='bg-white rounded-xl shadow-md p-4 md:p-5'>
      <h3 className='text-lg md:text-xl font-bold text-red-700 mb-4 flex items-center gap-2'>
        <FaClock className='text-red-600' />
        Select Delivery Slot
      </h3>

      {/* Date Selection */}
      <div className='mb-5'>
        <label className='text-sm font-semibold text-gray-700 mb-2 block'>
          📅 Select Delivery Date
        </label>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2'>
          {availableDates.map((dateObj) => (
            <button
              key={dateObj.date}
              onClick={() => handleDateChange(dateObj.date)}
              className={`py-3 px-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                selectedDate === dateObj.date
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:border-red-300 border-2 border-gray-200'
              }`}
            >
              <div className='text-xs opacity-90'>{dateObj.display}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slot Selection */}
      <div>
        <label className='text-sm font-semibold text-gray-700 mb-2 block'>
          🕐 Select Time Slot
        </label>
        {!selectedDate && (
          <div className='bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 mb-3'>
            <p className='text-yellow-800 text-sm font-medium'>
              ⚠️ Please select a delivery date first
            </p>
          </div>
        )}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {timeSlots.map((slot) => {
            const isAvailable = isSlotAvailable(slot.id)
            return (
              <button
                key={slot.id}
                onClick={() => isAvailable && handleSlotClick(slot.id)}
                disabled={!selectedDate || !isAvailable}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedSlot === slot.id
                    ? 'border-red-600 bg-red-50 shadow-md scale-105'
                    : isAvailable && selectedDate
                    ? 'border-gray-300 bg-white hover:border-red-400 hover:bg-red-50 hover:shadow-sm'
                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed grayscale'
                }`}
              >
                {/* Selected Badge */}
                {selectedSlot === slot.id && (
                  <div className='absolute top-2 right-2 bg-red-600 text-white rounded-full p-1'>
                    <FaCheckCircle size={14} />
                  </div>
                )}

                {/* Slot Icon & Tag */}
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-2xl'>{slot.icon}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    !isAvailable ? 'bg-gray-200 text-gray-500' :
                    selectedSlot === slot.id 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {slot.tag}
                  </span>
                </div>

                {/* Slot Time */}
                <div className={`font-bold text-sm md:text-base ${
                  selectedSlot === slot.id ? 'text-red-700' : !isAvailable ? 'text-gray-400' : 'text-gray-800'
                }`}>
                  {slot.label}
                </div>

                {/* Availability */}
                <div className={`text-xs mt-1 ${!isAvailable ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                  {isAvailable ? '✓ Available' : '❌ Slot Over'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Summary */}
      {selectedDate && selectedSlot && (
        <div className='mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <FaCheckCircle className='text-green-600 flex-shrink-0 mt-0.5' size={20} />
            <div className='flex-1'>
              <p className='font-semibold text-green-900 mb-1'>Delivery Scheduled</p>
              <p className='text-sm text-green-700'>
                Your order will be delivered on <span className='font-bold'>
                  {availableDates.find(d => d.date === selectedDate)?.display}
                </span> between <span className='font-bold'>
                  {timeSlots.find(s => s.id === selectedSlot)?.label}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className='mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3'>
        <p className='text-xs text-blue-800'>
          💡 <span className='font-semibold'>Note:</span> Please be available during your selected time slot. 
          Our delivery partner will call you before arriving.
        </p>
      </div>
    </div>
  )
}

export default DeliverySlotSelector

