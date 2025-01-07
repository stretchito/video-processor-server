import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const getJobStatus = async (req: Request<{ jobId: string }>, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error fetching job status:', error);
      res.status(500).json({ error: 'Failed to fetch job status' });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    // If the job has been processing for too long, mark it as failed
    if (data.status === 'processing' && data.started_at) {
      const startedAt = new Date(data.started_at);
      const now = new Date();
      const processingTime = now.getTime() - startedAt.getTime();
      
      if (processingTime > 300000) { // 5 minutes
        await supabase
          .from('processing_jobs')
          .update({
            status: 'error',
            last_error: 'Processing timeout reached'
          })
          .eq('id', jobId);
          
        res.status(408).json({ error: 'Processing timeout reached' });
        return;
      }
    }

    res.json(data);
    return;

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
};
