import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { processVideo } from '../services/videoProcessingService';

interface ProcessVideoRequest {
  videoUrl: string;
  options: {
    logo_path?: string;
    position?: string;
    greyscale?: boolean;
    output_format?: string;
  }
}

interface ProcessedVideoResult {
  outputPath: string;
}

const PROCESSING_TIMEOUT = 300000; // 5 minutes timeout

export const processVideoHandler = async (
  req: Request<{}, any, ProcessVideoRequest>, 
  res: Response
): Promise<void> => {
  try {
    console.log('Received video processing request:', req.body);
    const { videoUrl, options } = req.body;
    
    if (!videoUrl) {
      res.status(400).json({ error: 'Video URL is required' });
      return;
    }

    // Create new processing job
    const { data: newJob, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        video_path: videoUrl,
        logo_path: options.logo_path || '',
        position: options.position || 'top-left',
        greyscale: options.greyscale || false,
        output_format: options.output_format || 'mp4',
        status: 'pending'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating processing job:', jobError);
      res.status(500).json({ error: 'Failed to create processing job' });
      return;
    }

    // Start processing
    console.log('Starting video processing with job:', newJob);
    
    const processedVideo = await processVideo({
      videoPath: videoUrl,
      logoPath: options.logo_path || '',
      position: options.position || 'top-left',
      greyscale: options.greyscale || false,
      outputFormat: options.output_format || 'mp4',
      jobId: newJob.id
    }) as ProcessedVideoResult;

    console.log('Video processing completed:', processedVideo);

    res.json({ 
      message: 'Video processing completed',
      jobId: newJob.id,
      outputUrl: processedVideo.outputPath
    });
    return;

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
    return;
  }
};
