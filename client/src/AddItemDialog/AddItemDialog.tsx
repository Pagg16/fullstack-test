import { useState, type ChangeEvent } from "react";
import { api } from "../api/api";

interface AddItemDialogProps {
  onClose: () => void;
}

function AddItemDialog({ onClose }: AddItemDialogProps) {
  const [id, setId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    e: React.SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (!id.trim()) {
      setMessage("Please enter ID");
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.addItem(id);

      if (result.success) {
        setMessage(`Item with ID ${id} added successfully`);
        setTimeout(onClose, 1000);
      } else {
        setMessage(`Item with ID ${id} already exists`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setId(e.target.value);
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>Add New Item</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter item ID"
            value={id}
            onChange={handleChange}
          />
          <div className="dialog-buttons">
            <button type="submit">{isLoading ? "Loading..." : "Add"}</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default AddItemDialog;
