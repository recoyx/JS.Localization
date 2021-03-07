export default function loader(resPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        reject(new Error(`Failed to load resource at ${resPath}`));
    });
}