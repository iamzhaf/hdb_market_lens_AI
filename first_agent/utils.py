def read_ontology() -> str:
    """
    Read business ontology that explains concepts, synonyms, metrics, joins, and rules.
    """
    with open("ontology/ontology.md", "r", encoding="utf-8") as f:
        return f.read()

def read_prompts(file_name: str) -> str:
    """
    Read prompts that tells agent the SQL tables and schema.
    """
    with open("prompts/" + file_name, "r", encoding="utf-8") as f:
        return f.read()

if __name__ == "__main__":
    first_string = """First string"""
    second_string = read_prompts("agent_instruction.md")
    combined_string = first_string + "\n" + "\n" + second_string
    print(combined_string)