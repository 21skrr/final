### Resources – Endpoints by Role

---

## EMPLOYEE

#### GET /resources
* Description: List all accessible resources (based on stage, role, or program).
* Query Params: stage, type, programType
* Returns: [ { id, title, type, url, createdAt }, ... ]

#### GET /resources/:id
* Description: View specific resource details.
* Returns: { id, title, description, type, url, createdAt, updatedAt }

#### POST /resources/:id/download
* Description: Track and initiate resource download.
* Returns: download link or success acknowledgment.

---

## SUPERVISOR

#### GET /resources
* Description: Browse all available resources.

#### GET /resources/usage?employeeId=...
* Description: View resource usage by a specific employee (if tracking is enabled).
* Returns: [ { resourceId, accessedAt, completed }, ... ]

#### POST /resources/assign
* Description: Recommend or assign specific resources to an employee.
* Request Body:
  {
    userId: string,
    resourceId: string,
    reason?: string
  }

---

## MANAGER

#### GET /resources/summary
* Description: View usage summary across teams or departments.
* Query Params: departmentId, teamId, stage
* Returns: { resourceId, accessCount, completionRate, avgTimeSpent }

#### GET /resources/recommendations
* Description: View recommended resources by role or performance data.

---

## HR (HUMAN RESOURCES)

#### POST /resources
* Description: Upload or create a new resource.
* Request Body:
  {
    title: string,
    description: string,
    url: string,
    type: 'document' | 'link' | 'video' | 'other',
    stage: 'prepare' | 'orient' | 'land' | 'integrate' | 'excel',
    programType?: string
  }

#### PUT /resources/:id
* Description: Update resource metadata.
* Request Body: { title, description, url, stage, programType }

#### DELETE /resources/:id
* Description: Delete a resource.
* Returns: { success: true }

#### GET /resources
* Description: View all resources with advanced filtering and management controls.

#### GET /resources/analytics
* Description: Get global resource access analytics.
* Query Params: resourceId, dateRange
* Returns: { accessStats, downloadStats, usageByRole }
