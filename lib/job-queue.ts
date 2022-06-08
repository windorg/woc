import { Worker, Queue, Job } from 'bullmq'
import { beeminderSyncCard, BeeminderSyncCardPayload } from './jobs/beeminder-sync-card'

const redisConnection = {
  host: process.env.REDIS_HOST!,
  port: process.env.REDIS_PORT!,
  password: process.env.REDIS_PASSWORD!,
}

const jobQueue = new Queue('jobs', {
  connection: redisConnection,
})

export async function addJob(job: 'beeminder-sync-card', payload: BeeminderSyncCardPayload): Promise<Job>
export async function addJob(job: string, payload: any) {
  return await jobQueue.add(job, payload)
}

export function startJobQueueProcessing() {
  const worker = new Worker('jobs',
    async job => {
      switch (job.name) {
        case 'beeminder-sync-card': { await beeminderSyncCard(job.data); break }
        default: { console.log(`Unknown job ${job.name}`) }
      }
    },
    {
      connection: redisConnection,
    }
  )
  worker.on('error', err => {
    console.error(`job-queue worker failed: ${err.message}`)
  })
  worker.on('failed', (job, err) => {
    console.error(`Job ${job.name} failed: ${err.message}`)
  })
}