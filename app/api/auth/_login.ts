// pages/api/auth/_log.js
interface LogRequestBody {
    action: string;
    data: any; // Replace `any` with a more specific type if you know the structure of `data`
}

export default async function handler(
    req: { method: string; body: LogRequestBody },
    res: { status: (code: number) => { json: (body: any) => void } }
) {
    if (req.method === 'POST') {
        const { action, data } = req.body;

        // Here you would log the information to Firebase or another service
        console.log('Logging data:', action, data);

        return res.status(200).json({ message: 'Logged successfully' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
  