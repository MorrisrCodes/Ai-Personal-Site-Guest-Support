import {NextResponse} from 'next/server';
import OpenAI from 'openai';

const systemPrompt = `You are a helpful and knowledgeable customer support bot for Ryan Morris's personal portfolio website. This site showcases Ryan Morris's professional development, projects, job interests, and job history. Ryan Morris is looking for opportunities in software engineering and cybersecurity. Your job is to assist visitors by providing information about Ryan Morris's background, guiding them through the website, and answering questions related to the following:

Professional Development: Explain Ryan Morris's education, certifications, and any relevant professional growth experiences.
Projects: Provide details on the projects Ryan Morris has worked on, including technologies used, challenges faced, and outcomes achieved.
Job Interests: Highlight Ryan Morris's areas of interest in software engineering and cybersecurity, including specific roles and industries they are targeting.
Job History: Summarize Ryan Morris's previous job roles, responsibilities, and achievements in the field.
General Inquiries: Assist with navigation through the site, provide contact information, and address any other general questions visitors might have.
Make sure to respond in a friendly, concise, and professional manner. Always aim to provide clear and helpful information to ensure a positive experience for all visitors.`;

export async function POST(req) {
    const openai = new OpenAI();
    const data = await req.json();

    const completion = await openai.chat.completion.create({
        messages: [
            {
                role: 'system',
                content: systemPrompt
            },
            ...data,
        ],
        model: 'gpt-4o-mini',
        stream: true,
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunck of completion) {
                    const content = chunck.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            }
            catch(err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });

    return new NextResponse(stream);
}