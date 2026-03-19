/**
 * useAgents — React hook for Arcan AI agent interactions
 * 
 * Provides:
 * - scheduleEstimate(leadId) → spawns estimator-scheduler agent
 * - generateProposal(estimateId) → spawns proposal-generator agent
 * - triageMessage(messageData) → spawns customer-support agent
 * - qualifyLead(leadData) → spawns lead-qualifier agent (manual trigger)
 */

import { useState, useCallback } from 'react';

export function useAgents() {
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});

  const setAgentState = (key, { isLoading, result, error }) => {
    if (isLoading !== undefined) setLoading(prev => ({ ...prev, [key]: isLoading }));
    if (result !== undefined) setResults(prev => ({ ...prev, [key]: result }));
    if (error !== undefined) setErrors(prev => ({ ...prev, [key]: error }));
  };

  /**
   * Schedule an estimate for a lead
   * Calls POST /api/agents/schedule-estimator
   * @param {number|string} leadId
   * @returns {Promise<Object>} scheduling package with suggested_slots, pre_visit_card, etc.
   */
  const scheduleEstimate = useCallback(async (leadId) => {
    const key = `schedule-${leadId}`;
    setAgentState(key, { isLoading: true, error: null });

    try {
      const response = await fetch('/api/agents/schedule-estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule estimate');
      }

      setAgentState(key, { isLoading: false, result: data });
      return data;
    } catch (err) {
      setAgentState(key, { isLoading: false, error: err.message });
      throw err;
    }
  }, []);

  /**
   * Generate a proposal for an estimate
   * Calls POST /api/agents/proposal-generator
   * @param {number|string} estimateId
   * @returns {Promise<Object>} proposal with HTML, client_email, etc.
   */
  const generateProposal = useCallback(async (estimateId) => {
    const key = `proposal-${estimateId}`;
    setAgentState(key, { isLoading: true, error: null });

    try {
      const response = await fetch('/api/agents/proposal-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate proposal');
      }

      setAgentState(key, { isLoading: false, result: data });
      return data;
    } catch (err) {
      setAgentState(key, { isLoading: false, error: err.message });
      throw err;
    }
  }, []);

  /**
   * Triage an incoming customer message
   * Calls POST /api/agents/customer-support
   * @param {Object} messageData - { messageId?, messageText, senderName?, senderEmail?, senderPhone?, source? }
   * @returns {Promise<Object>} analysis with category, urgency, suggested_response, etc.
   */
  const triageMessage = useCallback(async (messageData) => {
    const key = `support-${messageData.messageId || Date.now()}`;
    setAgentState(key, { isLoading: true, error: null });

    try {
      const response = await fetch('/api/agents/customer-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to triage message');
      }

      setAgentState(key, { isLoading: false, result: data });
      return data;
    } catch (err) {
      setAgentState(key, { isLoading: false, error: err.message });
      throw err;
    }
  }, []);

  /**
   * Manually trigger lead qualification
   * Calls POST /api/agents/lead-qualifier
   * @param {Object} leadData - { leadId?, name, email?, phone?, serviceType, projectDescription?, address? }
   * @returns {Promise<Object>} qualification with score, estimated_value, recommended_action, etc.
   */
  const qualifyLead = useCallback(async (leadData) => {
    const key = `qualify-${leadData.leadId || leadData.name}`;
    setAgentState(key, { isLoading: true, error: null });

    try {
      const response = await fetch('/api/agents/lead-qualifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to qualify lead');
      }

      setAgentState(key, { isLoading: false, result: data });
      return data;
    } catch (err) {
      setAgentState(key, { isLoading: false, error: err.message });
      throw err;
    }
  }, []);

  return {
    scheduleEstimate,
    generateProposal,
    triageMessage,
    qualifyLead,
    loading,
    results,
    errors,
    // Convenience helpers
    isScheduling: (leadId) => loading[`schedule-${leadId}`] || false,
    isGeneratingProposal: (estimateId) => loading[`proposal-${estimateId}`] || false,
    isTriaging: (messageId) => loading[`support-${messageId}`] || false,
    isQualifying: (leadId) => loading[`qualify-${leadId}`] || false,
  };
}
