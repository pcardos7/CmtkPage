export default class Queue {
	constructor(size = 50) {
		this.queue = [];
		this.head = 0;
		this.tail = 0;
		this.size = size;
		this.isEmpty = true;
		this.isFull = false;
	}

	/**
	 * Writes data to the queue.
	 * @param {*} data - The data to write to the queue.
	 * @returns {boolean} - Returns true if the data was written successfully, false otherwise.
	 */
	Queue_Write(data) {
		if (this.isFull) {
			console.error("Queue is full, cannot write data.");
			return false; // Error code for full queue
		}

		// Add data to the queue
		this.queue[this.head] = data;
		// Move head pointer forward
		this.head = (this.head + 1) % this.size;
		// Update isEmpty and isFull flags
		this.isEmpty = false;

		// Check if the queue is now full
		if (this.head === this.tail) {
			this.isFull = true;
		}

		return true; // Success code
	}

	/**
	 * Reads data from the queue.
	 * @returns {*} - Returns the data read from the queue, or null if the queue is empty.
	 */
	Queue_Read() {
		if (this.isEmpty) {
			console.error("Queue is empty, cannot read data.");
			return null; // Error code for empty queue
		}

		// Read data from the queue
		const data = this.queue[this.tail];
		// Move tail pointer forward
		this.tail = (this.tail + 1) % this.size;
		// Update isEmpty and isFull flags
		this.isFull = false;

		// Check if the queue is now empty
		if (this.head === this.tail) {
			this.isEmpty = true;
		}

		return data;
	}

	/**
	 * Clears the queue.
	 */
	Queue_Clear() {
		this.queue = [];
		this.head = 0;
		this.tail = 0;
		this.isEmpty = true;
		this.isFull = false;
	}
}
