'use server'

import {
  getLeads as _getLeads,
  getLeadById as _getLeadById,
  createLead as _createLead,
  updateLead as _updateLead,
  deleteLead as _deleteLead,
  bulkDeleteLeads as _bulkDeleteLeads,
  bulkUpdateLeads as _bulkUpdateLeads,
} from './leads'
import {
  getCompanies as _getCompanies,
  getCompanyById as _getCompanyById,
  createCompany as _createCompany,
  updateCompany as _updateCompany,
  deleteCompany as _deleteCompany,
} from './companies'
import {
  getContacts as _getContacts,
  getContactById as _getContactById,
  createContact as _createContact,
  updateContact as _updateContact,
  deleteContact as _deleteContact,
} from './contacts'
import {
  getDeals as _getDeals,
  getDealsByStage as _getDealsByStage,
  createDeal as _createDeal,
  updateDealStage as _updateDealStage,
  updateDeal as _updateDeal,
  deleteDeal as _deleteDeal,
} from './deals'
import {
  getActivities as _getActivities,
  getActivitiesForEntity as _getActivitiesForEntity,
  createActivity as _createActivity,
  deleteActivity as _deleteActivity,
} from './activities'
import {
  getTasks as _getTasks,
  createTask as _createTask,
  updateTask as _updateTask,
  deleteTask as _deleteTask,
} from './tasks'
import {
  getNotes as _getNotes,
  getNotesForEntity as _getNotesForEntity,
  createNote as _createNote,
  updateNote as _updateNote,
  deleteNote as _deleteNote,
} from './notes'
import {
  getTimeline as _getTimeline,
  getTimelineForEntity as _getTimelineForEntity,
} from './timeline'
import {
  getPipelines as _getPipelines,
  getDefaultPipeline as _getDefaultPipeline,
  getPipelineStages as _getPipelineStages,
  createPipeline as _createPipeline,
  createStage as _createStage,
  updateStage as _updateStage,
} from './pipelines'

export const getLeads = _getLeads
export const getLeadById = _getLeadById
export const createLead = _createLead
export const updateLead = _updateLead
export const deleteLead = _deleteLead
export const bulkDeleteLeads = _bulkDeleteLeads
export const bulkUpdateLeads = _bulkUpdateLeads

export const getCompanies = _getCompanies
export const getCompanyById = _getCompanyById
export const createCompany = _createCompany
export const updateCompany = _updateCompany
export const deleteCompany = _deleteCompany

export const getContacts = _getContacts
export const getContactById = _getContactById
export const createContact = _createContact
export const updateContact = _updateContact
export const deleteContact = _deleteContact

export const getDeals = _getDeals
export const getDealsByStage = _getDealsByStage
export const createDeal = _createDeal
export const updateDealStage = _updateDealStage
export const updateDeal = _updateDeal
export const deleteDeal = _deleteDeal

export const getActivities = _getActivities
export const getActivitiesForEntity = _getActivitiesForEntity
export const createActivity = _createActivity
export const deleteActivity = _deleteActivity

export const getTasks = _getTasks
export const createTask = _createTask
export const updateTask = _updateTask
export const deleteTask = _deleteTask

export const getNotes = _getNotes
export const getNotesForEntity = _getNotesForEntity
export const createNote = _createNote
export const updateNote = _updateNote
export const deleteNote = _deleteNote

export const getTimeline = _getTimeline
export const getTimelineForEntity = _getTimelineForEntity

export const getPipelines = _getPipelines
export const getDefaultPipeline = _getDefaultPipeline
export const getPipelineStages = _getPipelineStages
export const createPipeline = _createPipeline
export const createStage = _createStage
export const updateStage = _updateStage
