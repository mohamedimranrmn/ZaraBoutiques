const BACKEND_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "https://zaraboutiquesbackend-f93i.onrender.com";

const PUBLIC_KEY = "public_qjPy1hyk8IbWKpix7wcsI2L9SXE=";

export async function uploadToImageKit(file) {
    // 1. Get authentication parameters from your backend
    const auth = await fetch(`${BACKEND_URL}/imagekit-auth`)
        .then((res) => res.json());

    const form = new FormData();
    form.append("file", file);
    form.append("fileName", `${Date.now()}_${file.name}`);
    form.append("folder", "/products");

    // Required ImageKit REST fields
    form.append("publicKey", PUBLIC_KEY);
    form.append("token", auth.token);
    form.append("expire", auth.expire);
    form.append("signature", auth.signature);

    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: form,
    });

    const result = await res.json();

    if (!result.url) {
        console.error("ImageKit Upload Error:", result);
        throw new Error(result.message || "Upload failed");
    }

    return result.url;
}
