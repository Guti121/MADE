import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { validateBrandAccess } from '../../middleware/accessMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { ContainerController } from '../../controllers/containers/containerController.js'
import { TypeContainerController } from '../../controllers/containers/typeContainersController.js'

export const containerRouter = Router()

const write = [authMiddleware, requireRole('owner', 'admin'), validateBrandAccess]
const read = [authMiddleware, validateBrandAccess]

// type Containers
containerRouter.post('/create-type', ...write, TypeContainerController.createTypeContainer)
containerRouter.delete('/delete-type', ...write, TypeContainerController.deleteTypeContainer)
containerRouter.get('/list-type', ...read, TypeContainerController.ListTypeContainer)
containerRouter.post('/update-type', ...write, TypeContainerController.updateTypeContainer)

// Containers
containerRouter.post('/create', ...write, ContainerController.createContainer)
containerRouter.post('/update', ...write, ContainerController.updateContainer)
containerRouter.delete('/delete', ...write, ContainerController.deleteContainer)
containerRouter.get('/list', ...read, ContainerController.listContainer)
