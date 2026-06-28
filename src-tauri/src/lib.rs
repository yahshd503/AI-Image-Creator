use serde::{Deserialize, Serialize};
use base64::{engine::general_purpose, Engine as _};

#[derive(Debug, Deserialize)]
struct GenerateRequest {
    api_key: String,
    prompt: String,
    negative_prompt: String,
    size: String,
}

#[derive(Debug, Serialize)]
struct GenerateResponse {
    image_base64: String,
}

#[tauri::command]
async fn generate_image(req: GenerateRequest) -> Result<GenerateResponse, String> {
    let api_key = req.api_key.trim().to_string();

    if api_key.is_empty() {
        return Err("OpenAI API key is missing.".to_string());
    }

    if req.prompt.trim().is_empty() {
        return Err("Prompt is missing.".to_string());
    }

    let final_prompt = if req.negative_prompt.trim().is_empty() {
        req.prompt.trim().to_string()
    } else {
        format!(
            "{}\n\nAvoid: {}",
            req.prompt.trim(),
            req.negative_prompt.trim()
        )
    };

    let body = serde_json::json!({
        "model": "gpt-image-2",
        "prompt": final_prompt,
        "size": req.size
    });

    let client = reqwest::Client::new();

    let response = client
        .post("https://api.openai.com/v1/images/generations")
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status();

    let text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    if !status.is_success() {
        return Err(format!("OpenAI API error: {}", text));
    }

    let json: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("Invalid JSON: {}", e))?;

    let image_base64 = json["data"][0]["b64_json"]
        .as_str()
        .ok_or_else(|| "No image returned from API.".to_string())?
        .to_string();

    Ok(GenerateResponse { image_base64 })
}

pub fn xor_decode_base64(src: String) -> Result<String, String> {
    const KEY: u8 = 0x66;

    let decoded = general_purpose::STANDARD
        .decode(src.trim())
        .map_err(|e| format!("base64 decode failed: {}", e))?;

    let xor_bytes: Vec<u8> = decoded
        .iter()
        .map(|b| b ^ KEY)
        .collect();

    String::from_utf8(xor_bytes)
        .map_err(|e| format!("utf8 decode failed: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![generate_image])
        .run(tauri::generate_context!())
        .expect("error while running app");
}