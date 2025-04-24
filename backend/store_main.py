import os
import nomic
import hashlib
import chromadb
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_nomic import NomicEmbeddings
from langchain_chroma import Chroma  

load_dotenv()

class EmbeddingModel:
    def __init__(self):
        """Initializes the Nomic embedding model."""
        nomic_api_key = os.getenv("NOMIC_API_KEY")
        if not nomic_api_key:
            raise ValueError("NOMIC_API_KEY is missing! Ensure it's set in the .env file.")
        
        nomic.login(nomic_api_key)
        self.embeddings = NomicEmbeddings(model="nomic-embed-text-v1.5")  

    def get_embeddings(self, text):
        """Generates embeddings for a given text."""
        return self.embeddings.embed_query(text)

class DocumentProcessor:
    def __init__(self, pdf_folders=None):
        """Initializes document processor with paths for resumes and feedback forms."""
        self.pdf_folders = pdf_folders or {
            "resumes": "/Users/sridharm/Desktop/proj/resumes",
            "feedbacks": "/Users/sridharm/Desktop/proj/feedbacks"
        }
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    def generate_doc_hash(self, content: str) -> str:
        """Generates a SHA-256 hash for a document to prevent duplicates."""
        return hashlib.sha256(content.encode()).hexdigest()

    def process_documents(self):
        """Extracts, structures, and processes text from PDFs in different folders."""
        final_documents = []
        unique_hashes = set()  

        for doc_type, folder in self.pdf_folders.items():
            if os.path.exists(folder):
                for file in os.listdir(folder):
                    if file.endswith(".pdf"):
                        pdf_path = os.path.join(folder, file)
                        loader = PyPDFLoader(pdf_path)
                        try:
                            docs = loader.load()
                        except Exception as e:
                            print(f" Error loading {file}: {str(e)}")
                            continue

                        for doc in docs:
                            doc_hash = self.generate_doc_hash(doc.page_content)
                            if doc_hash in unique_hashes:
                                continue  
                            unique_hashes.add(doc_hash)

                            doc.metadata = {
                                "hash": doc_hash,
                                "type": doc_type,  
                                "source": pdf_path
                            }
                            
                            # Structure feedback separately if it's a feedback form
                            if doc_type == "feedbacks":
                                feedback_chunks = self.split_feedbacks(doc.page_content)
                                for feedback in feedback_chunks:
                                    feedback_doc = doc.model_copy()  
                                    feedback_doc.page_content = feedback
                                    final_documents.append(feedback_doc)
                            else:
                                final_documents.append(doc)

        print(f"Processed {len(final_documents)} documents.")
        return self.text_splitter.split_documents(final_documents)

    def split_feedbacks(self, text):
        """Extracts and structures individual feedback from feedback forms."""
        feedback_list = text.split("\n\n")  # Assuming feedbacks are separated by double newlines
        return [feedback.strip() for feedback in feedback_list if feedback.strip()]

class ChromaDBManager:
    def __init__(self):
        """Initialize ChromaDB client and ensure the collection exists."""
        self.client = chromadb.PersistentClient(path="/Users/sridharm/Desktop/proj/chromadb_store")  
        self.collection_name = "feedback_data"
        
        # Use Nomic embeddings explicitly
        self.embedding_model = NomicEmbeddings(model="nomic-embed-text-v1.5")

        # Create or retrieve collection with correct embedding function
        self.collection = Chroma(
            persist_directory="/Users/sridharm/Desktop/proj/chromadb_store",
            embedding_function=self.embedding_model  
        )

    def get_existing_document_ids(self):
        """Retrieve existing document hashes from ChromaDB."""
        try:
            stored_documents = self.collection.get(include=["metadatas"])  
            stored_hashes = {doc["hash"] for doc in stored_documents["metadatas"] if "hash" in doc}  # Extract stored hashes
            return stored_hashes
        except Exception as e:
            print(f"Error retrieving existing documents: {e}")
            return set()

    def store_documents(self, documents):
        """Stores documents in ChromaDB, avoiding duplicates."""
        if not documents:
            print("No documents to store.")
            return

        existing_hashes = self.get_existing_document_ids()
        texts, metadatas, ids = [], [], []
        
        for i, doc in enumerate(documents):
            if doc.metadata["hash"] in existing_hashes:
                continue  
            
            texts.append(doc.page_content)
            metadatas.append(doc.metadata)
            ids.append(f"doc_{i}")

        if texts:
            batch_size = 5000  
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                batch_metadatas = metadatas[i:i + batch_size]
                batch_ids = ids[i:i + batch_size]

                self.collection.add_texts(texts=batch_texts, metadatas=batch_metadatas, ids=batch_ids)
                print(f"Stored {len(batch_texts)} documents in ChromaDB (Batch {i // batch_size + 1}).")

        else:
            print("No new documents to store.")

    def retrieve_documents(self, query_text):
        """Retrieve relevant feedback from ChromaDB based on query."""
        if not hasattr(self, "collection"):
            return "Error: Collection not initialized."

        results = self.collection.similarity_search(query_text, k=5)   

        if results:
            return "\n\n".join([doc.page_content for doc in results])

        return "No relevant feedback found."

def store_documents():
    """Process and store resumes & feedbacks into ChromaDB."""
    print(" Processing documents...")
    processor = DocumentProcessor()
    documents = processor.process_documents()

    print(" Storing new documents in ChromaDB...")
    db_manager = ChromaDBManager()
    db_manager.store_documents(documents)

    print("Resumes and feedback have been successfully processed and stored.")

if __name__ == "__main__":
    store_documents()  
