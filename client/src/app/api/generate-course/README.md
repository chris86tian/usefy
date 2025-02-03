### **Extracting Topic Timestamps from a Transcript**

This algorithm analyzes a YouTube transcript to identify significant topic shifts. It uses **Universal Sentence Encoder (USE)** for **semantic embedding** and **cosine similarity** to detect changes in meaning over time. The key steps are:

---

## **1. Load the Universal Sentence Encoder Model**
- The **Universal Sentence Encoder (USE)** is a deep learning model that converts text into **high-dimensional vector embeddings**.
- These embeddings capture semantic meaning, allowing the algorithm to compare similarity between different parts of the transcript.

```javascript
const model = await use.load();
```

---

## **2. Extract Sentences from the Transcript**
- The transcript is an array of objects, each containing:
  - `text`: The actual dialogue.
  - `offset`: The timestamp of when the text appears in the video.
- We extract only the `text` for embedding.

```javascript
const sentences = transcript.map(({ text }) => text);
```

---

## **3. Generate Embeddings for Each Sentence**
- The model generates a numerical **embedding** (vector) for each sentence.
- These embeddings represent the meaning of the sentences in a **high-dimensional space**.

```javascript
const embeddings = await model.embed(sentences);
const sentenceVectors = embeddings.arraySync();
```

---

## **4. Compare Sentences Using Cosine Similarity**
- **Cosine similarity** is used to measure the **semantic difference** between consecutive sentences.
- If the similarity score drops below a predefined **threshold**, it indicates a potential topic change.

### **Cosine Similarity Formula**  

```javascript
function cosineSimilarity(vecA, vecB) {
  const dotProduct = tf.tidy(() => tf.dot(tf.tensor1d(vecA), tf.tensor1d(vecB)).dataSync()[0]);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}
```

---

## **5. Identify Topic Change Timestamps**
- Iterate through the transcript, comparing **each sentence with the previous one**.
- If the similarity drops **below the threshold (e.g., 0.5)**, record the timestamp of the sentence as a **topic change**.

```javascript
const timestamps = [];
for (let i = 1; i < sentenceVectors.length; i++) {
  const similarity = cosineSimilarity(sentenceVectors[i - 1], sentenceVectors[i]);

  if (similarity < threshold) {
    timestamps.push(transcript[i].offset);
  }
}
```

---

## **Key Features of This Algorithm**
1. **Semantic Understanding** – Instead of detecting changes by **keywords**, it **understands meaning** using **deep learning embeddings**.
2. **Dynamic Topic Detection** – Works for **any language** (as long as USE supports it) and adjusts to **different styles of speech**.
3. **Efficient Processing** – Instead of **full clustering**, it uses **pairwise comparisons**, making it **faster and lighter**.
4. **Customizable Sensitivity** – The `threshold` can be adjusted to **increase or decrease** how often topics are detected.

---

### **Example Output**
For a **10-minute** video, the algorithm might return:

```json
[35, 120, 305, 480, 600]
```

Which means **topic changes occur at**:
- **00:35**
- **02:00**
- **05:05**
- **08:00**
- **10:00**

These timestamps are used to **annotate chapters** in the video player.
