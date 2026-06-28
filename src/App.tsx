import { useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

type GenerateResponse = {
  image_base64: string;
};

const appWindow = getCurrentWindow();

const styles = [
  "Cinematic",
  "Ultra Realistic",
  "Anime",
  "Fantasy",
  "Cyberpunk",
  "3D Render",
  "Oil Painting",
  "Product Shot"
];

const ideas = [
  "A futuristic Japanese city floating above the ocean, cinematic lighting, ultra detailed",
  "A magical fox walking through glowing bamboo forest, fantasy art, golden particles",
  "A passionate AI artist studio, neon glass interface, dramatic lighting, masterpiece",
  "A luxury robot designer creating holographic artwork inside a smart macOS studio"
];

export default function App() {
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("openai_api_key") || ""
  );
  const [showApiKey, setShowApiKey] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [selectedStyle, setSelectedStyle] = useState("Cinematic");
  const [image, setImage] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function showWarning(message: string) {
    window.alert(message);
  }

  function saveApiKey(value: string) {
    setApiKey(value);
    localStorage.setItem("openai_api_key", value);
  }

  async function closeWindow() {
    await appWindow.close();
  }

  async function minimizeWindow() {
    await appWindow.minimize();
  }

  async function toggleMaximizeWindow() {
    const maximized = await appWindow.isMaximized();

    if (maximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  }

  const enhancedPrompt = useMemo(() => {
    const base = prompt.trim();

    if (!base) {
      return "";
    }

    return `${base}, ${selectedStyle}, passionate atmosphere, smart composition, premium quality, beautiful lighting, ultra detailed`;
  }, [prompt, selectedStyle]);

  function surpriseMe() {
    const random = ideas[Math.floor(Math.random() * ideas.length)];
    setPrompt(random);
  }

  function improvePrompt() {
    if (!prompt.trim()) {
      setPrompt(ideas[0]);
      return;
    }

    setPrompt(
      `${prompt.trim()}, cinematic composition, emotional lighting, fantastic details, high-end concept art, award winning, 8k, masterpiece`
    );
  }

  async function generateImage() {
    if (!apiKey.trim()) {
      showWarning("Please enter your OpenAI API key.");
      return;
    }

    if (!prompt.trim()) {
      showWarning("Please enter your imagination first.");
      return;
    }

    setLoading(true);
    setImage("");

    try {
      const result = await invoke<GenerateResponse>("generate_image", {
        req: {
          api_key: apiKey.trim(),
          prompt: enhancedPrompt,
          negative_prompt: negativePrompt,
          size
        }
      });

      const dataUrl = `data:image/png;base64,${result.image_base64}`;
      setImage(dataUrl);
      setHistory((prev) => [dataUrl, ...prev].slice(0, 8));
    } catch (e) {
      showWarning(String(e));
    } finally {
      setLoading(false);
    }
  }

  function downloadImage() {
    if (!image) {
      showWarning("No image to download.");
      return;
    }

    const a = document.createElement("a");
    a.href = image;
    a.download = "ai-masterpiece.png";
    a.click();
  }

  return (
    <main className="app">
      <div className="aurora auroraOne" />
      <div className="aurora auroraTwo" />
      <div className="aurora auroraThree" />

      <header className="topbar" data-tauri-drag-region>
        <div className="traffic">
          <button
            type="button"
            className="trafficButton trafficClose"
            onClick={closeWindow}
            aria-label="Close"
          />
          <button
            type="button"
            className="trafficButton trafficMinimize"
            onClick={minimizeWindow}
            aria-label="Minimize"
          />
          <button
            type="button"
            className="trafficButton trafficMaximize"
            onClick={toggleMaximizeWindow}
            aria-label="Maximize"
          />
        </div>

        <div className="brand" data-tauri-drag-region>
          <div className="logo">✦</div>
          <div>
            <strong>AI Image Creator</strong>
            <small>Fantastic Smart Studio</small>
          </div>
        </div>

        <button type="button" className="ghostButton">
          Pro Studio
        </button>
      </header>

      <section className="workspace">
        <aside className="sidebar glass">
          <div className="sectionTitle">Inspiration</div>

          {[
            "🔥 Trending",
            "🌌 Fantasy",
            "🤖 Sci-Fi",
            "🌸 Anime",
            "🎬 Cinematic",
            "🏙 Architecture",
            "🐉 Dragons",
            "💎 Luxury"
          ].map((item) => (
            <button
              type="button"
              className="navItem"
              key={item}
              onClick={() =>
                setPrompt(`${item} concept artwork, beautiful, smart, passionate`)
              }
            >
              {item}
            </button>
          ))}

          <div className="sectionTitle spaceTop">Recent</div>

          <div className="miniGallery">
            {history.length === 0 && <p>No images yet.</p>}

            {history.map((src, index) => (
              <button type="button" key={index} onClick={() => setImage(src)}>
                <img src={src} alt="Generated history" />
              </button>
            ))}
          </div>
        </aside>

        <section className="creator glass">
          <div className="hero">
            <p className="eyebrow">Imagine anything</p>
            <h1>Create breathtaking AI artwork.</h1>
            <p className="subtitle">
              A passionate, intelligent, fantastic macOS-style creative studio.
            </p>
          </div>

          <div className="apiKeyBox">
            <label>
              OpenAI API Key
              <div className="apiKeyRow">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => saveApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((value) => !value)}
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
              </div>
            </label>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your imagination... Example: A floating cyberpunk temple above the clouds, neon sunset, cinematic lighting"
          />

          <div className="smartRow">
            <button type="button" onClick={improvePrompt}>
              ✨ Improve Prompt
            </button>
            <button type="button" onClick={surpriseMe}>
              🎲 Surprise Me
            </button>
          </div>

          <div className="chips">
            {styles.map((style) => (
              <button
                type="button"
                key={style}
                className={selectedStyle === style ? "chip active" : "chip"}
                onClick={() => setSelectedStyle(style)}
              >
                {style}
              </button>
            ))}
          </div>

          <div className="controlGrid">
            <label>
              Size
              <select value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="1024x1024">Square 1024×1024</option>
                <option value="1024x1536">Portrait 1024×1536</option>
                <option value="1536x1024">Landscape 1536×1024</option>
              </select>
            </label>

            <label>
              Negative Prompt
              <input
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="blurry, low quality, distorted"
              />
            </label>
          </div>

          <button
            type="button"
            className="generateButton"
            onClick={generateImage}
            disabled={loading}
          >
            {loading ? "Creating Masterpiece..." : "✨ Create Masterpiece"}
          </button>
        </section>

        <section className="preview glass">
          {!image && !loading && (
            <div className="emptyPreview">
              <div className="orb">✦</div>
              <h2>Your masterpiece appears here</h2>
              <p>Write a prompt, choose a style, then create.</p>
            </div>
          )}

          {loading && (
            <div className="thinking">
              <div className="pulseRing" />
              <h2>AI is painting...</h2>
              <p>Composing light, emotion, texture, and imagination.</p>
            </div>
          )}

          {image && !loading && (
            <div className="imageStage">
              <img src={image} alt="Generated AI artwork" />

              <div className="floatingToolbar">
                <button type="button">❤ Save</button>
                <button type="button">✨ Variations</button>
                <button type="button" onClick={downloadImage}>
                  ⬇ Download
                </button>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}