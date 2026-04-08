package com.kzoneworkspace.backend.agent.repository

import com.kzoneworkspace.backend.agent.entity.OfficeItem
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface OfficeItemRepository : JpaRepository<OfficeItem, Long>
