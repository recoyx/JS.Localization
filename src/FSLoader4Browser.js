export default function loader(resPath) {
    return new Promise((resolve, reject) => {
        reject(new Error(`Failed to load resource at ${resPath}`));
    });
}