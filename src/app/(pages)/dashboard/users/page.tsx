'use client'
import UserManagement from '@/components/user_management/User'
import React from 'react'
import { SectionHeading } from '@/components/dashboard/SectionHeading'

const page = () => {
  return (
    <div className="space-y-6">
      <SectionHeading
        title="User Management"
        description="Manage user accounts, roles, and permissions for your trading journal"
      />
      <UserManagement />
    </div>
  )
}

export default page