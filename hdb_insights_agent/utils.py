import os

def read_ontology() -> str:
    """
    Read business ontology that explains concepts, synonyms, metrics, joins, and rules.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(base_dir, "ontology", "hdb_ontology.md"), "r", encoding="utf-8") as f:
        return f.read()

def read_prompts(filename: str) -> str:
    """
    Read prompts that tells agent the SQL tables and schema.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(base_dir, "prompts", filename), "r", encoding="utf-8") as f:
        print(f)
        return f.read()

if __name__ == "__main__":
    first_string = """First string"""
    second_string = read_prompts("agent_instruction.md")
    combined_string = first_string + "\n" + "\n" + second_string
    print(combined_string)